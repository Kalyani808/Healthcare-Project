import os
import sys
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from documents.services.glm_ocr_service import GLMOCRService
from documents.services.mistral_extraction_service import MistralExtractionService
from documents.services.medicine_info_service import MedicineInfoService
from documents.services.audio_service import AudioService
from documents.icr_processor import extract_all_medicines_structured

def diagnose():
    img_path = os.path.join(BASE_DIR, 'media', 'medical_documents', 'dr_abhilash_handwritten.jpg')
    if not os.path.exists(img_path):
        print(f"[ERROR] Prescription image file not found: {img_path}")
        return

    print("==================================================================")
    print("  GODMODE DIAGNOSIS — HANDWRITTEN PRESCRIPTION (Dr. Abhilash)  ")
    print("==================================================================\n")

    t_start = time.time()

    # 1. OCR Stage
    ocr_service = GLMOCRService()
    t_ocr_0 = time.time()
    ocr_result = ocr_service.extract_text_from_image(img_path)
    t_ocr_1 = time.time()

    raw_ocr_text = ocr_result.get("text", "")
    method_used = ocr_result.get("method", "unknown")
    used_fallback = ocr_result.get("ocr_used_fallback", False)
    fallback_reason = ocr_result.get("ocr_fallback_reason", "None")

    print(f"--- 1. OCR STAGE RESULTS ---")
    print(f"OCR Method: {method_used}")
    print(f"OCR Fallback Triggered: {used_fallback}")
    print(f"OCR Fallback Reason: {fallback_reason}")
    print(f"OCR Execution Time: {t_ocr_1 - t_ocr_0:.2f} seconds")
    safe_raw_ocr = raw_ocr_text.encode('ascii', errors='ignore').decode('ascii')
    print(f"\n[RAW OCR TEXT OUTPUT]:\n{'-'*60}\n{safe_raw_ocr}\n{'-'*60}\n")

    # 2. Extraction Stage
    t_ext_0 = time.time()
    mistral_service = MistralExtractionService()
    
    # Check Ollama status directly for detailed diagnostic
    is_ollama_running, avail_models = mistral_service.check_ollama_availability()
    print(f"--- 2. MISTRAL / EXTRACTION DIAGNOSTIC ---")
    print(f"Ollama Reachable: {is_ollama_running}")
    print(f"Ollama Available Models: {avail_models}")

    raw_medicines, ext_method = mistral_service.extract_medicines(raw_ocr_text)
    t_ext_1 = time.time()

    print(f"Extraction Method Used: {ext_method}")
    print(f"Extraction Execution Time: {t_ext_1 - t_ext_0:.2f} seconds")
    print(f"\n[RAW EXTRACTED MEDICINES JSON]:\n{raw_medicines}\n")

    # 3. Heuristic Comparison Diagnostic
    heur_meds, heur_audio = extract_all_medicines_structured(raw_ocr_text)
    print(f"--- 3. HEURISTIC LINE PARSER DIAGNOSTIC ---")
    print(f"Heuristic Candidates Found: {len(heur_meds)}")
    for h_idx, hm in enumerate(heur_meds, start=1):
        print(f"  Candidate {h_idx}: {hm['name']} | Strength: {hm.get('strength')} | Freq: {hm.get('frequency')} | Raw Line: {hm.get('raw_line')}")

    # 4. Final Enriched Pipeline Output
    final_meds = MedicineInfoService.enrich_medicines_with_info(raw_medicines)
    en_audio, audio_dict = AudioService.generate_multilingual_audio_scripts(final_meds)

    t_end = time.time()

    print(f"\n==================================================================")
    print(f"  DIAGNOSIS COMPLETE — TOTAL PIPELINE TIME: {t_end - t_start:.2f}s")
    print(f"  FINAL MEDICINES RETURNED ({len(final_meds)}):")
    for f_idx, fm in enumerate(final_meds, start=1):
        print(f"  {f_idx}. {fm['name']} {fm.get('strength')} [{fm.get('confidence_label')}] — Freq: {fm.get('frequency')} | Timing: {fm.get('timing')}")
        print(f"     Info: {fm.get('info')}")
    print("==================================================================\n")

if __name__ == '__main__':
    diagnose()
