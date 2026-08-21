import os
import sys
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from documents.icr_extractor import PrescriptionICR
from documents.icr_processor import extract_all_medicines_structured

def test_pipeline():
    print("==================================================")
    print("    TESTING GODMODE v2 ICR HIGH-RECALL PIPELINE   ")
    print("==================================================\n")

    test_files = [
        os.path.join(BASE_DIR, 'media', 'medical_documents', 'test_psychiatric_prescription.jpg'),
        os.path.join(BASE_DIR, 'media', 'medical_documents', '2026', '08', 'rx_handwritten_typo.png'),
        os.path.join(BASE_DIR, 'media', 'medical_documents', '2026', '08', 'rx_printed.png')
    ]

    icr = PrescriptionICR()

    for idx, img_path in enumerate(test_files, start=1):
        if not os.path.exists(img_path):
            print(f"[SKIP] File not found: {img_path}")
            continue

        print(f"\n--- [TEST #{idx}] Processing: {os.path.basename(img_path)} ---")
        try:
            res = icr.extract_text(img_path)
            raw_text = res.get('extracted_text', '')
            lines_count = res.get('num_lines', 0)

            print(f"[RAW OCR TEXT LENGTH]: {len(raw_text)} chars ({lines_count} lines)")

            medicines, audio_script = extract_all_medicines_structured(raw_text)

            print(f"[EXTRACTION RESULT] Identified {len(medicines)} medicine candidates:")
            for m_idx, med in enumerate(medicines, start=1):
                warning_str = f" ({med.get('verification_warning')})" if med.get('verification_warning') else ""
                print(f"  {m_idx}. [{med.get('confidence_label')}{warning_str}] {med.get('name')} | Strength: {med.get('strength')} | Freq: {med.get('frequency')} | Conf: {med.get('confidence') * 100:.0f}%")
                print(f"     Info: {med.get('info')}")

            print(f"[AUDIO SCRIPT]: {audio_script[:220]}...")

        except Exception as e:
            print(f"[TEST ERROR] {str(e)}")

if __name__ == '__main__':
    test_pipeline()
