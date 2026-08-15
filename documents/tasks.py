import threading
from django.db import close_old_connections
from celery import shared_task
from .models import MedicalDocument
from .services.glm_ocr_service import GLMOCRService

def run_extraction(document_id):
    """Core function to execute OCR extraction on document via GLMOCRService."""
    close_old_connections()
    try:
        print(f"[BACKGROUND TASK] Starting OCR extraction for Document ID #{document_id}")
        document = MedicalDocument.objects.get(id=document_id)
        document.status = 'processing'
        document.save()

        ocr_service = GLMOCRService()
        result = ocr_service.extract_text_from_image(document.file.path)

        document.extracted_text = result['text']
        document.status = 'text_extracted'
        document.save()

        print(f"[BACKGROUND TASK SUCCESS] Document ID #{document_id} extracted via {result.get('method')}: {result['text'][:80]}...")
        return result
    except Exception as e:
        error_str = str(e)
        print(f"[BACKGROUND TASK ERROR] Document ID #{document_id}: {error_str}")
        try:
            close_old_connections()
            doc = MedicalDocument.objects.get(id=document_id)
            doc.status = 'failed'
            doc.error_message = error_str
            doc.save()
        except Exception as inner_e:
            print(f"[BACKGROUND TASK DB ERROR] {str(inner_e)}")
        return {"status": "failed", "error": error_str}
    finally:
        close_old_connections()

@shared_task
def extract_text_task(document_id):
    """Celery shared task wrapper for ICR extraction."""
    return run_extraction(document_id)

def delay_task(document_id):
    thread = threading.Thread(target=run_extraction, args=(document_id,), daemon=True)
    thread.start()
    return thread

extract_text_task.delay = delay_task
