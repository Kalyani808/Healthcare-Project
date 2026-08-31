from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from referrals.models import HealthcareProvider, DoctorReferral

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds verified doctor specialist providers and demo referral data safely (Idempotent).'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding trusted healthcare provider directory data..."))

        providers_data = [
            {
                "name": "Dr. K. Somasundaram",
                "specialization": "Cardiology",
                "qualification": "MBBS, MD (General Medicine), DM (Cardiology)",
                "experience_years": 18,
                "hospital_name": "Apollo Hospitals, Jubilee Hills",
                "address": "Road No. 72, Opposite Bharatiya Vidya Bhavan, Jubilee Hills",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500033",
                "phone_number": "+91-40-23607777",
                "registration_number": "TS-MMC-48921",
                "verification_status": "verified",
                "availability_status": "available",
                "consultation_type": "both",
                "latitude": 17.4245,
                "longitude": 78.4116,
                "profile_description": "Senior Interventional Cardiologist specializing in coronary angioplasty, heart failure management, and preventive cardiology."
            },
            {
                "name": "Dr. V. Rajeshwari",
                "specialization": "Neurology",
                "qualification": "MBBS, MD, DM (Neurology) - AIIMS",
                "experience_years": 15,
                "hospital_name": "Yashoda Hospitals, Somajiguda",
                "address": "Raj Bhavan Road, Somajiguda",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500082",
                "phone_number": "+91-40-23319999",
                "registration_number": "TS-MMC-51204",
                "verification_status": "verified",
                "availability_status": "available",
                "consultation_type": "both",
                "latitude": 17.4258,
                "longitude": 78.4587,
                "profile_description": "Consultant Neurologist specializing in stroke management, epilepsy, movement disorders, and neuro-rehabilitation."
            },
            {
                "name": "Dr. P. Venkatesh",
                "specialization": "Nephrology",
                "qualification": "MBBS, MD, DNB (Nephrology)",
                "experience_years": 14,
                "hospital_name": "KIMS Hospitals, Secunderabad",
                "address": "1-8-31/1, Minister Road, Krishna Nagar, Colony, Begumpet",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500003",
                "phone_number": "+91-40-44885000",
                "registration_number": "TS-MMC-62180",
                "verification_status": "verified",
                "availability_status": "available",
                "consultation_type": "both",
                "latitude": 17.4374,
                "longitude": 78.4842,
                "profile_description": "Lead Nephrologist expert in kidney transplantation, acute kidney injury, chronic kidney disease (CKD), and dialysis care."
            },
            {
                "name": "Dr. S. Meenakshi",
                "specialization": "Oncology",
                "qualification": "MBBS, MS, MCh (Surgical Oncology)",
                "experience_years": 16,
                "hospital_name": "Basavatarakam Indo-American Cancer Hospital",
                "address": "Road No. 14, Banjara Hills",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500034",
                "phone_number": "+91-40-23551235",
                "registration_number": "TS-MMC-39401",
                "verification_status": "verified",
                "availability_status": "available",
                "consultation_type": "both",
                "latitude": 17.4172,
                "longitude": 78.4350,
                "profile_description": "Senior Surgical Oncologist specializing in breast oncology, gastrointestinal cancers, and minimally invasive tumor surgeries."
            },
            {
                "name": "Dr. Ramesh Chandra",
                "specialization": "Orthopedics",
                "qualification": "MBBS, MS (Orthopedics), MCh (Ortho - UK)",
                "experience_years": 20,
                "hospital_name": "CARE Hospitals, Banjara Hills",
                "address": "Road No. 1, Banjara Hills",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500034",
                "phone_number": "+91-40-61656565",
                "registration_number": "TS-MMC-33412",
                "verification_status": "verified",
                "availability_status": "available",
                "consultation_type": "in_person",
                "latitude": 17.4144,
                "longitude": 78.4485,
                "profile_description": "Chief Joint Replacement Surgeon expert in robotic knee replacement, hip reconstruction, and complex trauma surgeries."
            },
            {
                "name": "Dr. Ananya Reddy",
                "specialization": "Gastroenterology",
                "qualification": "MBBS, MD, DM (Gastroenterology)",
                "experience_years": 12,
                "hospital_name": "AIG Hospitals (Asian Institute of Gastroenterology)",
                "address": "Plot No 2/3/4/5, Mindspace Rd, Gachibowli",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500032",
                "phone_number": "+91-40-42444222",
                "registration_number": "TS-MMC-71092",
                "verification_status": "verified",
                "availability_status": "available",
                "consultation_type": "both",
                "latitude": 17.4435,
                "longitude": 78.3772,
                "profile_description": "Consultant Medical Gastroenterologist & Hepatologist expert in ERCP, liver disorders, IBS, and therapeutic endoscopy."
            },
            {
                "name": "Dr. Srinivas Rao",
                "specialization": "Pulmonology",
                "qualification": "MBBS, MD (Pulmonary Medicine), FCCP",
                "experience_years": 14,
                "hospital_name": "Continental Hospitals, Nanakramguda",
                "address": "Plot No. 3, Road No. 2, IT Park, Nanakramguda, Financial District",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500032",
                "phone_number": "+91-40-67000000",
                "registration_number": "TS-MMC-58912",
                "verification_status": "verified",
                "availability_status": "available",
                "consultation_type": "both",
                "latitude": 17.4168,
                "longitude": 78.3440,
                "profile_description": "Senior Pulmonologist expert in asthma, COPD, sleep apnea, post-COVID lung recovery, and interventional pulmonology."
            },
            {
                "name": "Dr. Harini Mohan",
                "specialization": "General Medicine",
                "qualification": "MBBS, MD (General Medicine)",
                "experience_years": 10,
                "hospital_name": "Fernandez Hospital, Hyderguda",
                "address": "3-6-282, Liberty Road, Himayatnagar",
                "city": "Hyderabad",
                "state": "Telangana",
                "pincode": "500029",
                "phone_number": "+91-40-40222300",
                "registration_number": "TS-MMC-80415",
                "verification_status": "verified",
                "availability_status": "available",
                "consultation_type": "both",
                "latitude": 17.4005,
                "longitude": 78.4776,
                "profile_description": "Consultant Physician expert in hypertension, diabetic care, fever management, and preventive health screenings."
            }
        ]

        seeded_count = 0
        created_providers = []

        for pdata in providers_data:
            provider, created = HealthcareProvider.objects.update_or_create(
                registration_number=pdata["registration_number"],
                defaults=pdata
            )
            created_providers.append(provider)
            if created:
                seeded_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded/updated {len(created_providers)} verified doctor providers ({seeded_count} new)."))

        # Seed sample demo doctor referrals for any existing patient users
        users = User.objects.all()
        if users.exists():
            patient_user = users.first()
            cardio_doc = HealthcareProvider.objects.filter(specialization="Cardiology").first()
            neuro_doc = HealthcareProvider.objects.filter(specialization="Neurology").first()

            ref1, _ = DoctorReferral.objects.get_or_create(
                patient=patient_user,
                specialty="Cardiology",
                referring_doctor_name="Dr. Ravi Kumar",
                defaults={
                    "referring_facility": "Nalgonda Rural Primary Health Center (PHC)",
                    "referred_provider": cardio_doc,
                    "reason": "Persistent chest heaviness and hypertension requiring advanced cardiac evaluation.",
                    "notes": "ECG shows sinus tachycardia. Patient referred to city specialist for echocardiogram.",
                    "status": "active"
                }
            )

            ref2, _ = DoctorReferral.objects.get_or_create(
                patient=patient_user,
                specialty="Neurology",
                referring_doctor_name="Dr. Sunita Devi",
                defaults={
                    "referring_facility": "Warangal District Health Hospital",
                    "referred_provider": neuro_doc,
                    "reason": "Recurrent migraine with visual aura unresponsive to basic analgesics.",
                    "notes": "Patient advised MRI Brain and specialist neurology consultation.",
                    "status": "active"
                }
            )

            self.stdout.write(self.style.SUCCESS(f"Successfully configured demo patient referrals for user: {patient_user.email}"))
        else:
            self.stdout.write(self.style.WARNING("No users exist in DB yet. Demo referral created when user registers."))
