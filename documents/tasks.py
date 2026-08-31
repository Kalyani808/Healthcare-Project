import os
import threading
from django.db import close_old_connections
from celery import shared_task
from .models import MedicalDocument
from .services.glm_ocr_service import GLMOCRService

def run_extraction(document_id):
    """Core function to execute complete ICR & AI medicine extraction on document via background task."""
    close_old_connections()
    try:
        print(f"[BACKGROUND TASK] Starting OCR & AI extraction for Document ID #{document_id}")
        document = MedicalDocument.objects.get(id=document_id)
        document.status = 'processing'
        document.save()

        # Step 1: OCR Stage (OpenRouter -> Ollama GLM-OCR -> EasyOCR)
        ocr_service = GLMOCRService()
        result = ocr_service.extract_text_from_image(document.file.path)

        extracted_text = result.get('text', '') or result.get('extracted_text', '')
        document.extracted_text = extracted_text

        # Step 2: Post-OCR AI Entity Extraction & Classification Stage
        from .icr_extractor import assess_image_quality
        from .services.mistral_extraction_service import MistralExtractionService
        from .services.medicine_info_service import MedicineInfoService
        from .services.audio_service import AudioService
        from .services.lab_report_service import detect_document_classification, extract_lab_test_parameters

        # Image Quality Assessment
        quality_metrics = {"sharpness": 100, "brightness": 120, "contrast": 50, "image_quality": "high", "reason": "Acceptable image clarity"}
        if document.file and os.path.exists(document.file.path):
            quality_metrics = assess_image_quality(document.file.path)

        # Document Classification
        doc_classification = detect_document_classification(extracted_text)

        # Lab & Medicine Extraction
        confident_medicines = []
        needs_verification_data = []
        lab_data = {"is_lab_report": False, "parameters": [], "param_count": 0}
        method = result.get('model_used') or result.get('method', 'Vision OCR')

        if doc_classification == 'lab_report':
            lab_data = extract_lab_test_parameters(extracted_text)
            if lab_data.get('is_lab_report'):
                en_script = lab_data.get('audio_script', '')
                audio_scripts = lab_data.get('audio_scripts', {})
            else:
                en_script, audio_scripts = "", {}
        else:
            try:
                mistral_service = MistralExtractionService()
                raw_meds, method = mistral_service.extract_medicines(extracted_text)
                confident_medicines, needs_verification_data = MedicineInfoService.process_and_gate_medicines(raw_meds)
            except Exception as m_err:
                print(f"[BACKGROUND TASK MISTRAL FALLBACK] {m_err}")
                confident_medicines, needs_verification_data = [], []

            lab_data = extract_lab_test_parameters(extracted_text)
            en_script, audio_scripts = AudioService.generate_multilingual_audio_scripts(confident_medicines, raw_text=extracted_text)

        medicines_only_strings = [f"{item.get('name')} {item.get('strength')}".strip() for item in confident_medicines]
        avg_conf = float(sum(m.get('confidence', 0.8) for m in confident_medicines) / len(confident_medicines)) if confident_medicines else (0.90 if lab_data.get('is_lab_report') else 0.50)

        # Assemble full JSON extraction payload matching API response contract
        extracted_data_payload = {
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
            "text": extracted_text,
            "extracted_text": extracted_text,
            "raw_ocr_text": extracted_text,
            "is_handwritten_detected": True,
            "requires_manual_review": len(confident_medicines) == 0 and not lab_data.get('is_lab_report'),
            "issues": "Document analyzed successfully" if (len(confident_medicines) > 0 or lab_data.get('is_lab_report')) else "No medicines or lab parameters identified from document."
        }

        # Step 3: Persist Complete Extraction Payload & Update Status
        document.extracted_data = extracted_data_payload
        document.status = 'completed'
        document.save()

        safe_preview = extracted_text[:80].encode('ascii', errors='ignore').decode('ascii')
        print(f"[BACKGROUND TASK SUCCESS] Document ID #{document_id} full extraction completed via {method}: {safe_preview}...")
        return extracted_data_payload
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
