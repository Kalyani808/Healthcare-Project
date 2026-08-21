import os
import sys
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from documents.icr_extractor import PrescriptionICR
from documents.icr_processor import extract_all_medicines_structured

def test_pipeline():
    print("==================================================")
    print("    TESTING GODMODE ICR MULTI-MEDICINE PIPELINE    ")
    print("==================================================\n")

    media_dir = os.path.join(BASE_DIR, 'media', 'medical_documents', '2026', '08')
    image_files = glob.glob(os.path.join(media_dir, '*.jpeg')) + glob.glob(os.path.join(media_dir, '*.png'))

    if not image_files:
        print("No prescription image files found in media directory.")
        return

    icr = PrescriptionICR()

    for idx, img_path in enumerate(image_files[:4], start=1):
        print(f"\n--- [TEST #{idx}] Processing: {os.path.basename(img_path)} ---")
        try:
            res = icr.extract_text(img_path)
            raw_text = res.get('extracted_text', '')
            lines_count = res.get('num_lines', 0)

            print(f"[ICR SUMMARY] Extracted {len(raw_text)} chars across {lines_count} lines")
            print(f"[RAW OCR SAMPLE]:\n{raw_text[:250]}...\n")

            medicines, audio_script = extract_all_medicines_structured(raw_text)

            print(f"[EXTRACTION RESULT] Identified {len(medicines)} medicines:")
            for m_idx, med in enumerate(medicines, start=1):
                print(f"  {m_idx}. Name: {med.get('name')} | Strength: {med.get('strength')} | Freq: {med.get('frequency')} | Dur: {med.get('duration')} | Conf: {med.get('confidence') * 100:.0f}%")
                print(f"     Info: {med.get('info')}")

            print(f"[AUDIO SCRIPT]: {audio_script[:180]}...")

        except Exception as e:
            print(f"[TEST ERROR] {str(e)}")

if __name__ == '__main__':
    test_pipeline()
