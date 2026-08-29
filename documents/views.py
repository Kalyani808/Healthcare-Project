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
        Polling endpoint to check background ICR extraction progress with fuzzy medicine details & image quality.
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

        # Assess image quality
        quality_metrics = {"sharpness": 100, "brightness": 120, "contrast": 50, "image_quality": "high", "reason": "Acceptable image clarity"}
        if document.file and os.path.exists(document.file.path):
            quality_metrics = assess_image_quality(document.file.path)
            print(f"[QUALITY ASSESSMENT] Document #{document.id}: {quality_metrics}")

        extracted_str = document.extracted_text or ""
        safe_preview = extracted_str[:200].encode('ascii', errors='ignore').decode('ascii')
        print(f"\n[MEDICINE EXTRACTION] Document #{document.id}: {document.document_name}")
        print(f"[OCR OUTPUT] Raw text preview: {safe_preview}")

        from .services.mistral_extraction_service import MistralExtractionService
        from .services.medicine_info_service import MedicineInfoService
        from .services.audio_service import AudioService
        from .services.lab_report_service import detect_document_classification, extract_lab_test_parameters

        doc_classification = detect_document_classification(extracted_str)

        mistral_service = MistralExtractionService()
        raw_meds, method = mistral_service.extract_medicines(extracted_str)

        # Hard confidence gate (>= 0.75 confidence and valid non-null name)
        confident_medicines, needs_verification_data = MedicineInfoService.process_and_gate_medicines(raw_meds)

        # Extract structured Lab & Diagnostic Test Parameters
        lab_data = extract_lab_test_parameters(extracted_str)

        # Generate multilingual audio scripts (Prescription or Lab Report)
        if doc_classification == 'lab_report' and lab_data.get('is_lab_report'):
            en_script = lab_data.get('audio_script', '')
            audio_scripts = lab_data.get('audio_scripts', {})
        else:
            en_script, audio_scripts = AudioService.generate_multilingual_audio_scripts(confident_medicines)

        print(f"[{method.upper()} RESULT] Doc Classification: {doc_classification} | Meds: {len(confident_medicines)} | Lab Params: {lab_data.get('param_count', 0)}")

        medicines_only_strings = [f"{item.get('name')} {item.get('strength')}".strip() for item in confident_medicines]
        avg_conf = float(sum(m.get('confidence', 0.8) for m in confident_medicines) / len(confident_medicines)) if confident_medicines else (0.90 if lab_data.get('is_lab_report') else 0.50)

        return Response(
            {
                "status": "complete",
                "document_id": document.id,
                "doc_classification": doc_classification,
                "medicines_found": len(confident_medicines),
                "medicines": confident_medicines,
                "needs_verification": needs_verification_data,
                "medicines_only": medicines_only_strings,
                "lab_report": lab_data,
                "audio_script": en_script,
                "audio_scripts": audio_scripts,
                "extraction_method": method,
                "quality_metrics": quality_metrics,
                "image_quality": quality_metrics.get("image_quality", "medium"),
                "quality_reason": quality_metrics.get("reason", ""),
                "confidence": round(avg_conf, 2),
                "num_lines": len(confident_medicines) + lab_data.get('param_count', 0),
                "lines": [{"text": m} for m in medicines_only_strings],
                "text": extracted_str,
                "extracted_text": extracted_str,
                "raw_ocr_text": extracted_str,
                "is_handwritten_detected": True,
                "requires_manual_review": len(confident_medicines) == 0 and not lab_data.get('is_lab_report'),
                "issues": "Document analyzed successfully" if (len(confident_medicines) > 0 or lab_data.get('is_lab_report')) else "No medicines or lab parameters identified from document."
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

        from .services.mistral_extraction_service import MistralExtractionService
        from .services.medicine_info_service import MedicineInfoService
        from .services.audio_service import AudioService
        from .services.lab_report_service import detect_document_classification, extract_lab_test_parameters

        extracted_str = document.extracted_text or ""
        doc_classification = detect_document_classification(extracted_str)

        if doc_classification == 'lab_report':
            lab_data = extract_lab_test_parameters(extracted_str)
            script_text = lab_data.get('audio_scripts', {}).get(lang) or lab_data.get('audio_script', '')
        else:
            mistral_service = MistralExtractionService()
            raw_meds, _ = mistral_service.extract_medicines(extracted_str)
            confident_medicines, _ = MedicineInfoService.process_and_gate_medicines(raw_meds)
            _, audio_scripts = AudioService.generate_multilingual_audio_scripts(confident_medicines)
            script_text = audio_scripts.get(lang, "")

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

        # If user is authenticated and no explicit prescription context was passed, automatically attach their active medicines
        if not prescription_context and request.user and request.user.is_authenticated:
            try:
                from reminders.models import MedicationSchedule
                schedules = MedicationSchedule.objects.filter(user=request.user, is_active=True)
                if schedules.exists():
                    prescription_context = {
                        "active_medicines": [
                            {
                                "name": s.medicine_name,
                                "dosage": s.dosage,
                                "timing": s.food_timing,
                                "frequency": s.frequency,
                                "instructions": s.instructions or s.usage_summary
                            }
                            for s in schedules
                        ]
                    }
            except Exception as e:
                logger.warning(f"Failed to auto-fetch prescription context: {e}")

        from .services.chat_assistant_service import AIChatService
        result = AIChatService.generate_chat_response(
            messages_history=messages_history,
            prescription_context=prescription_context,
            user=request.user if request.user.is_authenticated else None,
            lang=lang
        )
        return Response(result, status=status.HTTP_200_OK)