import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_platform.settings')
django.setup()

from accounts.models import User, PatientProfile, HealthcareWorkerProfile, LanguagePreference

def seed_demo_accounts():
    print("==================================================================")
    print("  SEEDING DEMO ACCOUNTS (ramesh_kumar & dr_ananya)  ")
    print("==================================================================\n")

    # 1. Patient Demo User: ramesh_kumar
    patient_user, created_p = User.objects.get_or_create(
        username="ramesh_kumar",
        defaults={
            "email": "ramesh.kumar@sevahealth.org",
            "first_name": "Ramesh",
            "last_name": "Kumar",
            "role": "patient",
            "phone_number": "9876543210"
        }
    )
    patient_user.set_password("password123")
    patient_user.save()

    PatientProfile.objects.get_or_create(
        user=patient_user,
        defaults={
            "gender": "M",
            "address": "Village Rampur",
            "village_town": "Rampur",
            "district": "Sitapur",
            "state": "Uttar Pradesh",
            "emergency_contact_name": "Suresh Kumar",
            "emergency_contact_number": "9876543211"
        }
    )
    LanguagePreference.objects.get_or_create(user=patient_user, defaults={"preferred_language": "hi"})

    print(f"[DEMO PATIENT] Username: ramesh_kumar | Password: password123 | Created: {created_p} | Auth Test: {patient_user.check_password('password123')}")

    # 2. Doctor Demo User: dr_ananya
    doctor_user, created_d = User.objects.get_or_create(
        username="dr_ananya",
        defaults={
            "email": "dr.ananya@sevahealth.org",
            "first_name": "Ananya",
            "last_name": "Sharma",
            "role": "healthcare_worker",
            "phone_number": "9811122334"
        }
    )
    doctor_user.set_password("password123")
    doctor_user.save()

    HealthcareWorkerProfile.objects.get_or_create(
        user=doctor_user,
        defaults={
            "specialization": "General Medicine",
            "registration_number": "UP-MED-2024-8892",
            "facility_name": "Community Health Centre (CHC) Rampur",
            "facility_address": "Main Road, Rampur, Sitapur",
            "years_of_experience": 10
        }
    )
    LanguagePreference.objects.get_or_create(user=doctor_user, defaults={"preferred_language": "en"})

    print(f"[DEMO DOCTOR] Username: dr_ananya | Password: password123 | Created: {created_d} | Auth Test: {doctor_user.check_password('password123')}")
    print("\n==================================================================")
    print("  SEEDING COMPLETE! BOTH DEMO ACCOUNTS ARE NOW LIVE IN DATABASE.  ")
    print("==================================================================\n")

if __name__ == "__main__":
    seed_demo_accounts()
