import requests

BASE_URL = "http://127.0.0.1:8000"

def test_demo_logins():
    print("==================================================================")
    print("  TESTING DEMO ACCOUNTS VIA BACKEND HTTP AUTH ENDPOINT  ")
    print("==================================================================\n")

    # 1. Patient Demo Login
    p_resp = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": "ramesh_kumar", "password": "password123"})
    print("Patient Demo (ramesh_kumar) Status:", p_resp.status_code)
    if p_resp.status_code == 200:
        tokens = p_resp.json()
        print("  - Received JWT Access Token:", tokens.get("access")[:25] + "...")
        profile_resp = requests.get(f"{BASE_URL}/api/auth/profile/", headers={"Authorization": f"Bearer {tokens.get('access')}"})
        print("  - Profile Status:", profile_resp.status_code, profile_resp.json())

    # 2. Doctor Demo Login
    d_resp = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": "dr_ananya", "password": "password123"})
    print("\nDoctor Demo (dr_ananya) Status:", d_resp.status_code)
    if d_resp.status_code == 200:
        tokens = d_resp.json()
        print("  - Received JWT Access Token:", tokens.get("access")[:25] + "...")
        profile_resp = requests.get(f"{BASE_URL}/api/auth/profile/", headers={"Authorization": f"Bearer {tokens.get('access')}"})
        print("  - Profile Status:", profile_resp.status_code, profile_resp.json())

if __name__ == "__main__":
    test_demo_logins()
