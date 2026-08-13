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
                    "error": "ICR text extraction failed."
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
        print(f"[ICR OUTPUT] Raw text (first 200 chars): {extracted_str[:200]}")

        medicines_data, method = extract_medicines_with_ollama_fallback(extracted_str)
        print(f"[{method.upper()} RESULT] Found {len(medicines_data)} medicines")
        for med in medicines_data:
            print(f"  - {med.get('medicine')}: {med.get('dosage')} (confidence: {med.get('confidence')})")

        medicines_only_strings = [item.get("raw_line") or item.get("medicine") for item in medicines_data]

        return Response(
            {
                "status": "complete",
                "document_id": document.id,
                "medicines_found": len(medicines_data),
                "medicines": medicines_data,
                "medicines_only": medicines_only_strings,
                "extraction_method": method,
                "quality_metrics": quality_metrics,
                "image_quality": quality_metrics.get("image_quality", "medium"),
                "quality_reason": quality_metrics.get("reason", ""),
                "confidence": 0.88 if len(medicines_data) > 0 else 0.40,
                "num_lines": len(medicines_data),
                "lines": [{"text": m} for m in medicines_only_strings],
                "text": extracted_str,
                "extracted_text": extracted_str,
                "is_handwritten_detected": False,
                "requires_manual_review": len(medicines_data) == 0 or quality_metrics.get("image_quality") == "low",
                "issues": "No issues" if len(medicines_data) > 0 else f"No medicines identified. {quality_metrics.get('reason', '')}"
            },
            status=status.HTTP_200_OK
        )