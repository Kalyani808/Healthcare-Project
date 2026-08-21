import requests
import time
import os

BASE_URL = "http://127.0.0.1:8000"

def test_live_audit():
    print("==================================================================")
    print("  PART 6 -- LIVE END-TO-END UPLOAD TEST (dr_abhilash_handwritten.jpg)  ")
    print("==================================================================\n")

    # 1. Login as patient demo user
    login_res = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": "ramesh_kumar", "password": "password123"})
    if login_res.status_code != 200:
        print("LOGIN FAILED:", login_res.status_code, login_res.text)
        return
    token = login_res.json()["access"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[SUCCESS] Login Successful (ramesh_kumar)")

    # 2. Upload prescription document
    img_path = "media/medical_documents/dr_abhilash_handwritten.jpg"
    if not os.path.exists(img_path):
        print("ERROR: Image path not found:", img_path)
        return

    with open(img_path, "rb") as f:
        files = {"file": ("dr_abhilash_handwritten.jpg", f, "image/jpeg")}
        data = {"document_name": "Audit Prescription Test"}
        upload_res = requests.post(f"{BASE_URL}/api/documents/", headers=headers, data=data, files=files)

    if upload_res.status_code not in (200, 201):
        print("UPLOAD FAILED:", upload_res.status_code, upload_res.text)
        return

    doc_data = upload_res.json()
    doc_id = doc_data["id"]
    print(f"[SUCCESS] Document Uploaded: ID #{doc_id}")

    # 3. Trigger extraction
    extract_res = requests.post(f"{BASE_URL}/api/documents/{doc_id}/extract-text/", headers=headers)
    print(f"[SUCCESS] Extraction Triggered: Status {extract_res.status_code}")

    # 4. Poll extraction status until complete
    start_time = time.time()
    max_polls = 60
    for poll in range(1, max_polls + 1):
        time.sleep(2)
        status_res = requests.get(f"{BASE_URL}/api/documents/{doc_id}/extraction-status/", headers=headers)
        if status_res.status_code != 200:
            print(f"Poll #{poll}: Error status {status_res.status_code}")
            continue

        st_data = status_res.json()
        curr_status = st_data.get("status")
        print(f"  [Poll #{poll} @ {time.time() - start_time:.1f}s] Status: {curr_status}")

        if curr_status == "complete":
            elapsed = time.time() - start_time
            print("\n==================================================================")
            print("  LIVE EXTRACTION COMPLETED SUCCESSFULLY!")
            print("==================================================================")
            print(f"Total Time Taken: {elapsed:.2f} seconds")
            print(f"Extraction Method Used: {st_data.get('extraction_method')}")
            print(f"Medicines Found: {st_data.get('medicines_found')}")
            print(f"Confident Medicines: {st_data.get('medicines')}")
            print(f"Needs Verification: {st_data.get('needs_verification')}")
            print(f"Audio Script Generated: {bool(st_data.get('audio_script'))}")
            return
        elif curr_status == "failed":
            print("EXTRACTION FAILED:", st_data.get("error_message"))
            return

    print("POLLING TIMEOUT REACHED")

if __name__ == "__main__":
    test_live_audit()
