import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from documents.services.glm_ocr_service import GLMOCRService
from documents.services.mistral_extraction_service import MistralExtractionService
from documents.services.medicine_info_service import MedicineInfoService
from documents.services.audio_service import AudioService

def test_full_pipeline():
    print("==================================================================")
    print("  GODMODE v3 — OFFLINE OLLAMA (GLM-OCR + MISTRAL 7B) TEST HARNESS  ")
    print("==================================================================\n")

    test_images = [
        os.path.join(BASE_DIR, 'media', 'medical_documents', 'test_psychiatric_prescription.jpg'),
        os.path.join(BASE_DIR, 'media', 'medical_documents', '2026', '08', 'rx_handwritten_typo.png'),
        os.path.join(BASE_DIR, 'media', 'medical_documents', '2026', '08', 'rx_printed.png')
    ]

    ocr_service = GLMOCRService()
    mistral_service = MistralExtractionService()

    is_running, available_models = ocr_service.check_ollama_availability()
    print(f"[OLLAMA HEALTH] Reachable: {is_running}")
    print(f"[AVAILABLE MODELS]: {available_models}\n")

    for idx, img_path in enumerate(test_images, start=1):
        if not os.path.exists(img_path):
            print(f"[SKIP TEST #{idx}] File missing: {img_path}")
            continue

        print(f"--- [TEST #{idx}] Processing Image: {os.path.basename(img_path)} ---")
        try:
            # Step 1: GLM-OCR
            ocr_res = ocr_service.extract_text_from_image(img_path)
            raw_text = ocr_res.get("text", "")
            print(f"[OCR ENGINE]: {ocr_res.get('method')} ({ocr_res.get('model_used')})")
            print(f"[RAW OCR TEXT ({len(raw_text)} chars)]:\n{raw_text[:250]}...\n")

            # Step 2: Mistral Extraction
            raw_meds, ext_method = mistral_service.extract_medicines(raw_text)
            print(f"[EXTRACTION METHOD]: {ext_method}")

            # Step 3: Medicine Information Enrichment
            enriched_meds = MedicineInfoService.enrich_medicines_with_info(raw_meds)
            print(f"[SUCCESS] Extracted {len(enriched_meds)} medicine entries:")

            for m_idx, med in enumerate(enriched_meds, start=1):
                warn_str = f" ({med['verification_warning']})" if med.get('verification_warning') else ""
                print(f"  {m_idx}. {med['name']} {med.get('strength')} [{med['confidence_label']}{warn_str}]")
                print(f"     Freq: {med.get('frequency')} | Duration: {med.get('duration')} | Timing: {med.get('timing')}")
                print(f"     Info: {med['info']}")

            # Step 4: Multilingual Audio Guidance
            en_script, audio_dict = AudioService.generate_multilingual_audio_scripts(enriched_meds)
            print(f"\n[AUDIO ENGLISH]: {audio_dict['en'][:180]}...")
            print(f"[AUDIO HINDI]: {audio_dict['hi'][:180]}...")
            print(f"[AUDIO MARATHI]: {audio_dict['mr'][:180]}...\n")

        except Exception as e:
            print(f"[TEST #{idx} ERROR]: {str(e)}\n")

if __name__ == '__main__':
    test_full_pipeline()
