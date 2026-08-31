import os
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MedicalDocument
from .serializers import MedicalDocumentSerializer
from .icr_extractor import assess_image_quality
from .icr_processor import extract_medicines_with_ollama_fallback


class MedicalDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['transcribe_voice', 'speak_text', 'ai_chat'] or self.request.path.startswith('/api/voice/transcribe') or self.request.path.startswith('/api/chat'):
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        # each user only sees their own documents
        return MedicalDocument.objects.filter(user=self.request.user).order_by('-uploaded_at')

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
            lang=lang
        )
        return Response(result, status=status.HTTP_200_OK)