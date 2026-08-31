from emergency.models import EmergencyFacility

SEED_FACILITIES_DATA = [
    {
        "name": "Osmania General Hospital & Trauma Center",
        "facility_type": "hospital",
        "address": "Afzal Gunj, High Court Road, Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500012",
        "phone_number": "040-24600121",
        "emergency_hotline": "108",
        "ambulance_phone": "108",
        "latitude": 17.373600,
        "longitude": 78.477000,
        "is_24_hours": True,
        "has_icu": True,
        "has_blood_bank": True,
        "available_services": "24/7 Level-1 Trauma Care, Emergency Surgery, General ICU, Blood Bank"
    },
    {
        "name": "Apollo Hospitals Jubilee Hills",
        "facility_type": "hospital",
        "address": "Road No 72, Film Nagar, Jubilee Hills, Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500033",
        "phone_number": "040-23607777",
        "emergency_hotline": "1066",
        "ambulance_phone": "108",
        "latitude": 17.426500,
        "longitude": 78.411100,
        "is_24_hours": True,
        "has_icu": True,
        "has_blood_bank": True,
        "available_services": "24/7 Cardiac Emergency, Neuro Trauma, Advanced ICU, Ventilator Support"
    },
    {
        "name": "Yashoda Hospitals Somajiguda",
        "facility_type": "hospital",
        "address": "Raj Bhavan Road, Somajiguda, Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500082",
        "phone_number": "040-45674567",
        "emergency_hotline": "040-23319999",
        "ambulance_phone": "108",
        "latitude": 17.424300,
        "longitude": 78.458900,
        "is_24_hours": True,
        "has_icu": True,
        "has_blood_bank": True,
        "available_services": "24/7 Critical Care, Stroke Unit, Trauma Surgery, CT/MRI Diagnostics"
    },
    {
        "name": "NIMS Emergency & Trauma Block",
        "facility_type": "emergency_room",
        "address": "Nizam's Institute of Medical Sciences, Punjagutta, Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500082",
        "phone_number": "040-23489000",
        "emergency_hotline": "108",
        "ambulance_phone": "108",
        "latitude": 17.425800,
        "longitude": 78.452600,
        "is_24_hours": True,
        "has_icu": True,
        "has_blood_bank": True,
        "available_services": "24/7 Emergency Resuscitation, Cardiac Emergency, Dialysis, Trauma Center"
    },
    {
        "name": "Apollo 24/7 Pharmacy Jubilee Hills",
        "facility_type": "pharmacy",
        "address": "Jubilee Hills Check Post Road, Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500033",
        "phone_number": "040-23600000",
        "emergency_hotline": "1860-500-0101",
        "ambulance_phone": "108",
        "latitude": 17.432000,
        "longitude": 78.407000,
        "is_24_hours": True,
        "has_icu": False,
        "has_blood_bank": False,
        "available_services": "24/7 Emergency Prescriptions, First Aid Supplies, Injectables, Surgical Items"
    },
    {
        "name": "MedPlus 24/7 Emergency Pharmacy",
        "facility_type": "pharmacy",
        "address": "Main Road, Somajiguda, Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500082",
        "phone_number": "040-67006700",
        "emergency_hotline": "040-67006700",
        "ambulance_phone": "108",
        "latitude": 17.423000,
        "longitude": 78.457000,
        "is_24_hours": True,
        "has_icu": False,
        "has_blood_bank": False,
        "available_services": "24/7 Life Saving Drugs, Oxygen Cylinders, Cold Chain Medicines"
    },
    {
        "name": "Red Cross 24/7 Blood Bank",
        "facility_type": "blood_bank",
        "address": "Red Cross Road, Vidyanagar, Adikmet, Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500044",
        "phone_number": "040-27633087",
        "emergency_hotline": "040-27633087",
        "ambulance_phone": "108",
        "latitude": 17.398000,
        "longitude": 78.508000,
        "is_24_hours": True,
        "has_icu": False,
        "has_blood_bank": True,
        "available_services": "24/7 Emergency Blood Supply, Packed Red Blood Cells (PRBC), Platelets, FFP"
    },
    {
        "name": "NTR Memorial 24/7 Blood Center",
        "facility_type": "blood_bank",
        "address": "Road No 2, Banjara Hills, Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500034",
        "phone_number": "040-23548888",
        "emergency_hotline": "040-23548888",
        "ambulance_phone": "108",
        "latitude": 17.421000,
        "longitude": 78.438000,
        "is_24_hours": True,
        "has_icu": False,
        "has_blood_bank": True,
        "available_services": "24/7 Blood Components, Apheresis, Rare Blood Group Emergency Donor Matching"
    }
]

def seed_initial_facilities():
    """Populate initial 24/7 emergency facilities if none exist."""
    count = 0
    for data in SEED_FACILITIES_DATA:
        obj, created = EmergencyFacility.objects.get_or_create(
            name=data["name"],
            defaults=data
        )
        if created:
            count += 1
    return count
