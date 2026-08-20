import os
import requests
import time

BASE_URL = "http://127.0.0.1:8000"
IMG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "media", "medical_documents", "dr_abhilash_handwritten.jpg")

def test_upload():
    print("==================================================================")
    print("  TESTING LIVE WEBAPP UPLOAD & POLLING PATH  ")
    print("==================================================================\n")

    # 1. Login to get JWT Token
    username = f"testuser_{int(time.time())}"
    reg_data = {
        "username": username,
        "password": "Password123!",
        "role": "patient",
        "first_name": "Test",
        "last_name": "Patient",
        "email": f"{username}@example.com",
        "phone_number": "9876543210"
    }
    reg_resp = requests.post(f"{BASE_URL}/api/auth/register/", json=reg_data)
    print("Registration status:", reg_resp.status_code)

    login_data = {"username": username, "password": "Password123!"}
    resp = requests.post(f"{BASE_URL}/api/auth/login/", json=login_data)
    tokens = resp.json()
    access_token = tokens.get("access")
    headers = {"Authorization": f"Bearer {access_token}"}
    print(f"[AUTH] Successfully authenticated {username}. Token:", access_token[:20] + "...")

    # 2. Upload Document
    with open(IMG_PATH, "rb") as f:
        files = {"file": ("dr_abhilash_handwritten.jpg", f, "image/jpeg")}
        data = {"document_name": "Dr Abhilash Rx", "document_type": "image"}
        upload_resp = requests.post(f"{BASE_URL}/api/documents/", headers=headers, files=files, data=data)

    print("Upload Status Code:", upload_resp.status_code, upload_resp.text)
    doc_data = upload_resp.json()
    doc_id = doc_data.get("id")
    if not doc_id:
        print("[UPLOAD ERROR]", upload_resp.text)
        return

    # 3. Trigger Extract Text
    ext_resp = requests.post(f"{BASE_URL}/api/documents/{doc_id}/extract-text/", headers=headers)
    print("Extract Text Status Code:", ext_resp.status_code, ext_resp.json())

    # 4. Poll Extraction Status Endpoint
    poll_start = time.time()
    for attempt in range(1, 46):
        time.sleep(2)
        status_resp = requests.get(f"{BASE_URL}/api/documents/{doc_id}/extraction-status/", headers={"Authorization": f"Bearer {access_token}"})
        elapsed = time.time() - poll_start

        if status_resp.status_code != 200:
            print(f"[POLL {attempt} @ {elapsed:.1f}s] HTTP ERROR {status_resp.status_code}: {status_resp.text}")
            continue

        res_data = status_resp.json()
        st = res_data.get("status")
        print(f"[POLL {attempt} @ {elapsed:.1f}s] Document #{doc_id} Status: '{st}'")

        if st == "complete":
            print("\n==================================================================")
            print("  LIVE WEBAPP UPLOAD COMPLETED SUCCESSFULLY!  ")
            print(f"  Total Webapp Execution Time: {elapsed:.2f}s")
            print(f"  Extraction Method: {res_data.get('extraction_method')}")
            print(f"  Confident Medicines ({len(res_data.get('medicines', []))}): {res_data.get('medicines')}")
            print(f"  Needs Verification Items ({len(res_data.get('needs_verification', []))}): {res_data.get('needs_verification')}")
            print("==================================================================\n")
            return
        elif st == "failed":
            print(f"[POLL FAILED] Error message: {res_data.get('error_message')}")
            return

    print("[POLL TIMEOUT] Reached 90 seconds limit without completion.")

if __name__ == "__main__":
    test_upload()
