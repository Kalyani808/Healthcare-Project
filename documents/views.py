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
        print(f"\n[MEDICINE EXTRACTION] Document #{document.id}: {document.document_name}")
        print(f"[OCR OUTPUT] Raw text (first 200 chars): {extracted_str[:200]}")

        from .services.mistral_extraction_service import MistralExtractionService
        from .services.medicine_info_service import MedicineInfoService
        from .services.audio_service import AudioService

        mistral_service = MistralExtractionService()
        raw_meds, method = mistral_service.extract_medicines(extracted_str)

        # Enrich with educational medicine info (without altering prescribed dosage)
        medicines_data = MedicineInfoService.enrich_medicines_with_info(raw_meds)

        # Generate multilingual audio scripts (English, Hindi, Marathi)
        en_script, audio_scripts = AudioService.generate_multilingual_audio_scripts(medicines_data)

        print(f"[{method.upper()} RESULT] Found {len(medicines_data)} medicines")
        for med in medicines_data:
            print(f"  - {med.get('name') or med.get('medicine')}: strength={med.get('strength')}, freq={med.get('frequency')}, duration={med.get('duration')}, timing={med.get('timing')} (confidence: {med.get('confidence')})")

        medicines_only_strings = [f"{item.get('name')} {item.get('strength')}".strip() for item in medicines_data]
        avg_conf = float(sum(m.get('confidence', 0.8) for m in medicines_data) / len(medicines_data)) if medicines_data else 0.40

        return Response(
            {
                "status": "complete",
                "document_id": document.id,
                "medicines_found": len(medicines_data),
                "medicines": medicines_data,
                "medicines_only": medicines_only_strings,
                "audio_script": en_script,
                "audio_scripts": audio_scripts,
                "extraction_method": method,
                "quality_metrics": quality_metrics,
                "image_quality": quality_metrics.get("image_quality", "medium"),
                "quality_reason": quality_metrics.get("reason", ""),
                "confidence": round(avg_conf, 2),
                "num_lines": len(medicines_data),
                "lines": [{"text": m} for m in medicines_only_strings],
                "text": extracted_str,
                "extracted_text": extracted_str,
                "raw_ocr_text": extracted_str,
                "is_handwritten_detected": True,
                "requires_manual_review": len(medicines_data) == 0,
                "issues": "Medicines identified successfully" if len(medicines_data) > 0 else "No medicines identified from prescription text."
            },
            status=status.HTTP_200_OK
        )