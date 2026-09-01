import os
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MedicalDocument
from .serializers import MedicalDocumentSerializer
from .icr_extractor import assess_image_quality
from .icr_processor import extract_medicines_with_ollama_fallback


import hashlib


def calculate_file_hash(file_obj):
    """Calculates SHA-256 hash of an uploaded file object."""
    hasher = hashlib.sha256()
    file_obj.seek(0)
    for chunk in iter(lambda: file_obj.read(4096), b""):
        hasher.update(chunk)
    file_obj.seek(0)
    return hasher.hexdigest()


class MedicalDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['transcribe_voice', 'speak_text', 'ai_chat', 'analyze_chat_image'] or self.request.path.startswith('/api/voice/transcribe') or self.request.path.startswith('/api/chat'):
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        # each user only sees their own documents
        return MedicalDocument.objects.filter(user=self.request.user).order_by('-uploaded_at')

    def create(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get('file')
        file_hash = None

        if uploaded_file:
            file_hash = calculate_file_hash(uploaded_file)
            print(f"[DUPLICATE CHECK] Calculated file hash: {file_hash}")

            # 1. Search for existing completed document with same user + same file_hash
            existing_doc = MedicalDocument.objects.filter(
                user=request.user,
                file_hash=file_hash,
                status__in=['completed', 'text_extracted', 'translated']
            ).order_by('-uploaded_at').first()

            # 2. Check legacy records missing file_hash if no direct hash match
            if not existing_doc:
                legacy_docs = MedicalDocument.objects.filter(
                    user=request.user,
                    status__in=['completed', 'text_extracted', 'translated'],
                    file_hash__isnull=True
                ).order_by('-uploaded_at')[:15]

                for leg in legacy_docs:
                    if leg.file and os.path.exists(leg.file.path):
                        try:
                            with open(leg.file.path, 'rb') as f:
                                leg_hash = hashlib.sha256(f.read()).hexdigest()
                                leg.file_hash = leg_hash
                                leg.save(update_fields=['file_hash'])
                                if leg_hash == file_hash and leg.extracted_data and isinstance(leg.extracted_data, dict) and leg.extracted_data.get('status') == 'complete':
                                    existing_doc = leg
                                    break
                        except Exception as leg_err:
                            print(f"[DUPLICATE CHECK] Error checking legacy document #{leg.id}: {leg_err}")

            # 3. If reusable completed document is found, reuse PostgreSQL results without running extraction again
            if existing_doc and existing_doc.extracted_data and isinstance(existing_doc.extracted_data, dict) and existing_doc.extracted_data.get('status') == 'complete':
                print(f"[DUPLICATE CHECK] Existing completed document found: #{existing_doc.id}")
                print(f"[DUPLICATE CHECK] Reusing saved extraction data")

                doc_name = request.data.get('document_name') or existing_doc.document_name
                new_doc = MedicalDocument.objects.create(
                    user=request.user,
                    document_name=doc_name,
                    document_type=existing_doc.document_type or 'image',
                    file=uploaded_file,
                    status='completed',
                    extracted_text=existing_doc.extracted_text or '',
                    extracted_data=existing_doc.extracted_data or {},
                    file_hash=file_hash
                )

                serializer = self.get_serializer(new_doc)
                res_data = serializer.data
                res_data['is_duplicate'] = True
                res_data['is_reused'] = True
                res_data['reused_from_id'] = existing_doc.id
                res_data['message'] = "Prescription already uploaded. Using previously extracted results."
                return Response(res_data, status=status.HTTP_201_CREATED)

            print(f"[DUPLICATE CHECK] No previous completed document found for hash {file_hash}")
            print(f"[EXTRACTION] Starting new extraction flow")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        if file_hash and serializer.instance:
            serializer.instance.file_hash = file_hash
            serializer.instance.save(update_fields=['file_hash'])

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='extract-text')
    def extract_text(self, request, pk=None):
        """
        POST /api/documents/{id}/extract-text/
        Dispatches background ICR extraction task and returns HTTP 202 Accepted.
        """
        document = self.get_object()

        if not document.file:
            return Response(
                {"error": "No file attached to document"},
                status=status.HTTP_400_BAD_REQUEST
            )

        file_path = document.file.path
        if not os.path.exists(file_path):
            return Response(
                {"error": f"File not found: {file_path}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent duplicate task execution if document is already processing or completed
        if document.status in ['processing', 'completed']:
            return Response(
                {
                    "status": "processing" if document.status == 'processing' else "complete",
                    "document_id": document.id,
                    "message": f"ICR text extraction task is currently '{document.status}'."
                },
                status=status.HTTP_200_OK
            )

        # Update status to processing
        document.status = 'processing'
        document.save()

        # Trigger background task asynchronously (Celery + background thread fallback)
        print(f"[ICR VIEW] Triggering background extract_text_task for Document #{document.id}")
        import threading
        from .tasks import run_extraction
        thread = threading.Thread(target=run_extraction, args=(document.id,), daemon=True)
        thread.start()

        return Response(
            {
                "status": "processing",
                "document_id": document.id,
                "message": "ICR text extraction task initiated in background."
            },
            status=status.HTTP_202_ACCEPTED
        )

    @action(detail=True, methods=['get', 'post'], url_path='extract-medicines')
    def extract_medicines(self, request, pk=None):
        """
        POST/GET /api/documents/{id}/extract-medicines/
        Action endpoint returning extracted medicines and audio status.
        """
        return self.extraction_status(request, pk=pk)

    @action(detail=True, methods=['get'], url_path='extraction-status')
    def extraction_status(self, request, pk=None):
        """
        GET /api/documents/{id}/extraction-status/
        Pure 100% read-only polling endpoint to return cached background extraction results.
        """
        document = self.get_object()

        if document.status in ['processing', 'uploaded']:
            return Response(
                {
                    "status": "processing",
                    "document_id": document.id
                },
                status=status.HTTP_200_OK
            )

        if document.status == 'failed':
            return Response(
                {
                    "status": "failed",
                    "document_id": document.id,
                    "error": "Prescription OCR extraction failed.",
                    "error_message": document.error_message or "Unknown extraction failure"
                },
                status=status.HTTP_200_OK
            )

        # Serve persisted background extraction payload
        if document.extracted_data and isinstance(document.extracted_data, dict) and document.extracted_data.get("status"):
            return Response(document.extracted_data, status=status.HTTP_200_OK)

        # Fallback for legacy documents lacking pre-computed extracted_data payload
        extracted_str = document.extracted_text or ""
        return Response(
            {
                "status": "complete",
                "document_id": document.id,
                "doc_classification": "prescription",
                "medicines_found": 0,
                "medicines": [],
                "needs_verification": [],
                "medicines_only": [],
                "lab_report": {"is_lab_report": False, "parameters": [], "param_count": 0},
                "audio_script": "",
                "audio_scripts": {},
                "extraction_method": "text_extracted_legacy",
                "quality_metrics": {},
                "image_quality": "medium",
                "quality_reason": "",
                "confidence": 0.50,
                "num_lines": 0,
                "lines": [],
                "text": extracted_str,
                "extracted_text": extracted_str,
                "raw_ocr_text": extracted_str,
                "is_handwritten_detected": True,
                "requires_manual_review": True,
                "issues": "Legacy text extracted without saved payload."
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'], url_path='audio', permission_classes=[permissions.AllowAny])
    def get_document_audio(self, request, pk=None):
        """
        Stream high-quality native MP3 audio for the prescription or lab report in Telugu, Hindi, Marathi, or English.
        """
        from django.http import HttpResponse
        document = self.get_object()
        lang = request.query_params.get('lang', 'en').lower()
        if lang.startswith('te'): lang = 'te'
        elif lang.startswith('hi'): lang = 'hi'
        elif lang.startswith('mr'): lang = 'mr'
        else: lang = 'en'

        script_text = ""
        # Prefer pre-computed cached audio script from document.extracted_data
        if document.extracted_data and isinstance(document.extracted_data, dict):
            audio_scripts = document.extracted_data.get('audio_scripts')
            if isinstance(audio_scripts, dict):
                script_text = audio_scripts.get(lang) or document.extracted_data.get('audio_script', '')

        if not script_text:
            from .services.mistral_extraction_service import MistralExtractionService
            from .services.medicine_info_service import MedicineInfoService
            from .services.audio_service import AudioService
            from .services.lab_report_service import detect_document_classification, extract_lab_test_parameters

            extracted_str = document.extracted_text or ""
            doc_classification = detect_document_classification(extracted_str)

            if doc_classification == 'lab_report':
                lab_data = extract_lab_test_parameters(extracted_str)
                scripts = lab_data.get('audio_scripts', {})
                if isinstance(scripts, dict):
                    script_text = scripts.get(lang) or lab_data.get('audio_script', '')
            else:
                try:
                    mistral_service = MistralExtractionService()
                    raw_meds, _ = mistral_service.extract_medicines(extracted_str)
                    confident_medicines, _ = MedicineInfoService.process_and_gate_medicines(raw_meds)
                    _, audio_scripts = AudioService.generate_multilingual_audio_scripts(confident_medicines, raw_text=extracted_str)
                    if isinstance(audio_scripts, dict):
                        script_text = audio_scripts.get(lang, "")
                except Exception as ex:
                    print(f"[AUDIO GEN FALLBACK] {ex}")

        if not script_text:
            extracted_str = document.extracted_text or ""
            if lang == 'te':
                script_text = f"ప్రిస్క్రిప్షన్ వివరాలు: {extracted_str[:200]}. దయచేసి మీ డాక్టర్ సూచించిన విధంగా మందులను సరైన సమయానికి తీసుకోండి."
            elif lang == 'hi':
                script_text = f"पर्चे का विवरण: {extracted_str[:200]}। कृपया अपनी दवाएं डॉक्टर के निर्देशानुसार समय पर लें।"
            elif lang == 'mr':
                script_text = f"प्रिस्क्रिप्शन तपशील: {extracted_str[:200]}. कृपया तुमची औषधे वेळेवर आणि डॉक्टरांच्या सल्ल्यानुसार घ्या."
            else:
                script_text = f"Prescription Content: {extracted_str[:200]}. Please take your medicines regularly as advised by your doctor."

        from .audio_generator import generate_audio_for_text
        audio_bytes = generate_audio_for_text(script_text, lang=lang)
        return HttpResponse(audio_bytes, content_type="audio/mpeg")

    @action(detail=False, methods=['get', 'post'], url_path='speak', permission_classes=[permissions.AllowAny])
    def speak_text(self, request):
        """
        Stream high-quality native MP3 audio for arbitrary text in Telugu, Hindi, Marathi, or English.
        """
        from django.http import HttpResponse
        if request.method == 'POST':
            text = request.data.get('text', '')
            lang = request.data.get('lang', 'en').lower()
        else:
            text = request.query_params.get('text', '')
            lang = request.query_params.get('lang', 'en').lower()

        if lang.startswith('te'): lang = 'te'
        elif lang.startswith('hi'): lang = 'hi'
        elif lang.startswith('mr'): lang = 'mr'
        else: lang = 'en'

        from .audio_generator import generate_audio_for_text
        audio_bytes = generate_audio_for_text(text, lang=lang)
        return HttpResponse(audio_bytes, content_type="audio/mpeg")

    @action(detail=False, methods=['post'], url_path='transcribe', permission_classes=[permissions.AllowAny])
    def transcribe_voice(self, request):
        """
        POST /api/documents/transcribe/ (or /api/voice/transcribe/)
        Receives an audio file/blob ('audio' or 'file') recorded locally by browser MediaRecorder API.
        Transcribes speech and auto-detects language using local faster-whisper on CPU.
        """
        audio_file = request.FILES.get('audio') or request.FILES.get('file')
        if not audio_file:
            return Response(
                {"status": "error", "error": "No audio file uploaded in request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .services.voice_transcription_service import VoiceTranscriptionService
        result = VoiceTranscriptionService.transcribe_audio_file(audio_file)
        
        if result["status"] == "error":
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='analyze-image', permission_classes=[permissions.AllowAny])
    def analyze_chat_image(self, request):
        """
        POST /api/documents/analyze-image/ (or /api/chat/analyze-image/)
        Analyzes a captured or uploaded image (medicine or skin/face) for Health Sahayak Bot.
        """
        image_file = request.FILES.get('image') or request.FILES.get('file')
        b64_image = request.data.get('image_b64') or request.data.get('image_data')
        lang = request.data.get('lang', 'en').lower()

        if not image_file and not b64_image:
            return Response(
                {"status": "error", "error": "No image file or base64 data provided in request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if image_file:
            image_data = image_file.read()
            mime_type = image_file.content_type or "image/jpeg"
        else:
            image_data = b64_image
            mime_type = "image/jpeg"

        from .services.chat_assistant_service import AIChatService
        result = AIChatService.analyze_chat_image(image_data, mime_type=mime_type, lang=lang)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='chat', permission_classes=[permissions.AllowAny])
    def ai_chat(self, request):
        """
        POST /api/documents/chat/ (or /api/chat/)
        Generates conversational response with prescription awareness and Indian pharmacology intelligence.
        """
        messages_history = request.data.get('messages', [])
        if not messages_history and 'query' in request.data:
            messages_history = [{"sender": "user", "text": request.data.get('query')}]

        if not messages_history:
            return Response(
                {"status": "error", "error": "No messages history provided in request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        prescription_context = request.data.get('prescription_context')
        image_context = request.data.get('image_context') or request.data.get('image_analysis_context')
        lang = request.data.get('lang', 'en').lower()
        if lang.startswith('te'): lang = 'te'
        elif lang.startswith('hi'): lang = 'hi'
        elif lang.startswith('mr'): lang = 'mr'
        else: lang = 'en'

        # Retrieve authenticated user's latest completed MedicalDocument context
        prescription_context = None
        if request.user and request.user.is_authenticated:
            try:
                latest_doc = MedicalDocument.objects.filter(
                    user=request.user,
                    status='completed'
                ).order_by('-uploaded_at').first()

                if latest_doc and latest_doc.extracted_data:
                    prescription_context = latest_doc.extracted_data
            except Exception as e:
                logger.warning(f"Failed to auto-fetch latest completed MedicalDocument context: {e}")

        # Fallback to request payload if authenticated user has no completed document or user is unauthenticated
        if not prescription_context:
            prescription_context = request.data.get('prescription_context') or {}

        from .services.chat_assistant_service import AIChatService
        result = AIChatService.generate_chat_response(
            messages_history=messages_history,
            prescription_context=prescription_context,
            user=request.user if request.user.is_authenticated else None,
            lang=lang,
            image_context=image_context
        )
        return Response(result, status=status.HTTP_200_OK)