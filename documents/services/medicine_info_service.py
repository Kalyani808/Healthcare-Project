import re

MEDICINE_PURPOSE_DICTIONARY = {
    "augmentin": {
        "purpose": "Broad-spectrum antibiotic (Amoxicillin + Clavulanic Acid)",
        "general_use": "Commonly prescribed to treat bacterial infections of the chest, throat, ears, sinuses, or skin.",
        "precautions": "Take as instructed by your doctor. Complete the full prescribed course even if symptoms improve early."
    },
    "ultracit": {
        "purpose": "Antacid and alkalinizing agent",
        "general_use": "Used to relieve acidity, heartburn, or burning sensations during urination.",
        "precautions": "Drink adequate water throughout the day while taking this medication."
    },
    "pan": {
        "purpose": "Proton Pump Inhibitor (Pantoprazole)",
        "general_use": "Reduces stomach acid production to treat acidity, heartburn, and acid reflux.",
        "precautions": "Best taken 30 minutes before breakfast as prescribed."
    },
    "pan-dsr": {
        "purpose": "Combination Antacid & Anti-emetic (Pantoprazole + Domperidone)",
        "general_use": "Treats severe acid reflux, GERD, nausea, and indigestion.",
        "precautions": "Usually taken on an empty stomach, 30 minutes before breakfast."
    },
    "paracetamol": {
        "purpose": "Analgesic and Antipyretic",
        "general_use": "Commonly used for pain relief and fever reduction.",
        "precautions": "Do not exceed recommended daily dose to protect liver health."
    },
    "crocin": {
        "purpose": "Analgesic and Antipyretic (Paracetamol)",
        "general_use": "Used for pain relief and fever reduction.",
        "precautions": "Maintain proper intervals between doses as advised."
    },
    "dolo": {
        "purpose": "Analgesic and Antipyretic (Paracetamol 650mg)",
        "general_use": "Used for relief from fever, body aches, and headaches.",
        "precautions": "Follow exact dosage intervals specified by your physician."
    },
    "amoxicillin": {
        "purpose": "Penicillin Antibiotic",
        "general_use": "Used to treat various bacterial infections.",
        "precautions": "Complete the full antibiotic course prescribed by your doctor."
    },
    "azithromycin": {
        "purpose": "Macrolide Antibiotic",
        "general_use": "Prescribed for respiratory, throat, ear, or skin bacterial infections.",
        "precautions": "Take once daily at the same time each day as directed."
    },
    "cetirizine": {
        "purpose": "Antihistamine",
        "general_use": "Relieves allergy symptoms like runny nose, sneezing, and itching.",
        "precautions": "May cause mild drowsiness. Avoid driving if feeling drowsy."
    },
    "metformin": {
        "purpose": "Oral Antidiabetic",
        "general_use": "Helps control blood sugar levels in patients with Type 2 diabetes.",
        "precautions": "Take with meals to reduce stomach upset."
    },
    "atorvastatin": {
        "purpose": "Lipid-lowering Statin",
        "general_use": "Used to lower cholesterol levels and support heart health.",
        "precautions": "Best taken in the evening or at bedtime as advised."
    },
    "amlodipine": {
        "purpose": "Calcium Channel Blocker",
        "general_use": "Prescribed to control high blood pressure (hypertension).",
        "precautions": "Take regularly at the same time every day."
    }
}

class MedicineInfoService:
    @staticmethod
    def get_medicine_info(med_name):
        """
        Retrieve safe general educational guidance for an extracted medicine name.
        Does NOT alter prescribed dosage or replace doctor instructions.
        """
        if not med_name:
            return "Follow timings and dosage strictly as instructed by your healthcare provider."

        clean = re.sub(r'[^a-zA-Z]', '', med_name).lower()

        for key, details in MEDICINE_PURPOSE_DICTIONARY.items():
            if key in clean or clean in key:
                return (
                    f"{details['purpose']}. {details['general_use']} "
                    f"General note: {details['precautions']}"
                )

        return (
            f"Prescribed medication ({med_name}). Follow the exact dosage, frequency, and instructions "
            "written on your prescription by your physician."
        )

    @classmethod
    def enrich_medicines_with_info(cls, medicines_list):
        """
        Enrich a list of extracted medicine dictionaries with general educational information.
        """
        enriched = []
        for med in medicines_list:
            item = dict(med)
            name = item.get("name") or item.get("medicine") or ""
            if name:
                item["info"] = cls.get_medicine_info(name)
                enriched.append(item)
        return enriched

    @classmethod
    def process_and_gate_medicines(cls, raw_medicines_list):
        """
        Hard Confidence Gate (Step 2):
        - Items with confidence >= 0.75 and a valid non-null name are returned as confident_medicines.
        - Items with confidence < 0.75, garbled text, or null name are moved to needs_verification list.
        """
        confident = []
        needs_verification = []

        for item in raw_medicines_list:
            med_name = item.get("name") or item.get("medicine")
            conf = float(item.get("confidence", 0.0))

            # Reject hallucinated / low-confidence guesses
            if med_name and med_name.strip() and conf >= 0.75:
                enriched_item = dict(item)
                enriched_item["name"] = med_name.strip().capitalize()
                enriched_item["medicine"] = enriched_item["name"]
                enriched_item["info"] = cls.get_medicine_info(enriched_item["name"])
                confident.append(enriched_item)
            else:
                raw = item.get("raw_text") or item.get("raw_line") or med_name or ""
                if raw and len(raw.strip()) > 2:
                    needs_verification.append({
                        "raw_text": raw.strip(),
                        "suggested_name": med_name.strip() if med_name else "",
                        "strength": item.get("strength") or item.get("dosage") or "",
                        "frequency": item.get("frequency") or "",
                        "duration": item.get("duration") or "",
                        "confidence": conf,
                        "verification_reason": "Low confidence or garbled handwriting stroke — please verify manually"
                    })

        return confident, needs_verification
