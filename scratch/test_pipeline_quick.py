import os
import sys
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from documents.services.glm_ocr_service import GLMOCRService
from documents.services.mistral_extraction_service import MistralExtractionService
from documents.services.medicine_info_service import MedicineInfoService
from documents.services.audio_service import AudioService

def main():
    img_path = os.path.join(BASE_DIR, 'media', 'medical_documents', '2026', '08', 'rx_printed.png')
    if not os.path.exists(img_path):
        print(f"File not found: {img_path}")
        return

    print("==================================================================")
    print("  TESTING WEBAPP PIPELINE PATH (GLM-OCR + MISTRAL 7B)  ")
    print("==================================================================\n")

    t0 = time.time()
    ocr = GLMOCRService()
    res = ocr.extract_text_from_image(img_path)
    t_ocr = time.time()

    print(f"OCR Method: {res.get('method')} (Fallback: {res.get('ocr_used_fallback', False)})")
    print(f"OCR Time: {t_ocr - t0:.2f}s")
    print(f"OCR Text Snippet:\n{res.get('text', '')[:180]}...\n")

    mistral = MistralExtractionService()
    raw_meds, ext_method = mistral.extract_medicines(res.get('text', ''))
    t_ext = time.time()

    print(f"Extraction Method: {ext_method}")
    print(f"Mistral Time: {t_ext - t_ocr:.2f}s")

    enriched = MedicineInfoService.enrich_medicines_with_info(raw_meds)
    print(f"\nExtracted {len(enriched)} medicines:")
    for idx, m in enumerate(enriched, start=1):
        print(f"  {idx}. {m['name']} {m.get('strength')} [{m['confidence_label']}] - Freq: {m.get('frequency')}")

    en_script, audio_dict = AudioService.generate_multilingual_audio_scripts(enriched)
    print(f"\nAudio Script Length: {len(en_script)} chars")
    print(f"Total Pipeline Execution Time: {t_ext - t0:.2f}s")

if __name__ == '__main__':
    main()
