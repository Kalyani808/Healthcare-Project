import threading
from django.db import close_old_connections
from celery import shared_task
from .models import MedicalDocument
from .icr_extractor import PrescriptionICR

def run_extraction(document_id):
    """Core function to execute ICR extraction on document with Django DB connection handling."""
    close_old_connections()
    try:
        print(f"[BACKGROUND TASK] Starting ICR extraction for Document ID #{document_id}")
        document = MedicalDocument.objects.get(id=document_id)
        document.status = 'processing'
        document.save()

        icr = PrescriptionICR()
        result = icr.extract_text(document.file.path, document_id=document.id)

        document.extracted_text = result['text']
        document.status = 'text_extracted'
        document.save()

        print(f"[BACKGROUND TASK SUCCESS] Document ID #{document_id} extracted: {result['text'][:80]}...")
        return result
    except Exception as e:
        print(f"[BACKGROUND TASK ERROR] Document ID #{document_id}: {str(e)}")
        try:
            close_old_connections()
            doc = MedicalDocument.objects.get(id=document_id)
            doc.status = 'failed'
            doc.save()
        except Exception as inner_e:
            print(f"[BACKGROUND TASK DB ERROR] {str(inner_e)}")
        return {"status": "failed", "error": str(e)}
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
