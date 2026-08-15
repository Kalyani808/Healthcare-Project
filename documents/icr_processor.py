import re
from rapidfuzz import fuzz

NON_MEDICINE_HEADERS = [
    "hospital", "clinic", "doctor", "dr.", "patient", "assessment", "out patient", "in patient",
    "opd", "ipd", "date:", "age:", "gender:", "male", "female", "address", "phone", "rx", "rx:",
    "prescription", "department", "reg. no", "consultant", "signature", "welcome", "promise of health",
    "sl no", "sl.no", "name:", "yrs", "years", "sex:", "date"
]

MEDICINE_PURPOSE_KNOWLEDGE = {
    "paracetamol": "Commonly used for pain relief and reducing fever.",
    "acetaminophen": "Commonly used for pain relief and fever reduction.",
    "crocin": "Contains Paracetamol. Used for pain and fever relief.",
    "dolo": "Contains Paracetamol 650mg. Commonly used for fever and pain.",
    "metacin": "Contains Paracetamol for fever and pain management.",
    "ibuprofen": "Non-steroidal anti-inflammatory drug (NSAID) for pain, swelling, and fever.",
    "brufen": "Contains Ibuprofen. Used for pain relief and anti-inflammatory action.",
    "combiflam": "Combination of Ibuprofen and Paracetamol for acute pain and fever.",
    "aspirin": "Blood thinner and pain reliever. Reduces pain, inflammation, and clot risk.",
    "ecosprin": "Low-dose aspirin used for cardiovascular protection and clot prevention.",
    "amoxicillin": "Antibiotic used to treat bacterial infections of throat, chest, or ears.",
    "amoxil": "Amoxicillin antibiotic for bacterial infections.",
    "augmentin": "Amoxicillin + Clavulanate antibiotic for resistant bacterial infections.",
    "azithromycin": "Broad-spectrum macrolide antibiotic taken for respiratory or skin infections.",
    "azithral": "Contains Azithromycin. Treats bacterial respiratory and skin infections.",
    "ciprofloxacin": "Fluoroquinolone antibiotic for urinary tract, chest, and gut infections.",
    "ciplox": "Contains Ciprofloxacin antibiotic.",
    "cefixime": "Cephalosporin antibiotic for urinary, ear, and throat infections.",
    "taxim": "Cephalosporin antibiotic treatment.",
    "pantoprazole": "Proton pump inhibitor (PPI) that reduces stomach acid and GERD/ulcer symptoms.",
    "pan": "Contains Pantoprazole for stomach acid reduction.",
    "pantocid": "Contains Pantoprazole to treat acid reflux and indigestion.",
    "omeprazole": "Reduces excess stomach acid secretion.",
    "omez": "Omeprazole capsule for hyperacidity and stomach heartburn.",
    "ranitidine": "Histamine H2-blocker that decreases acid production in stomach.",
    "gelusil": "Antacid syrup/tablet for instant relief from acidity and heartburn.",
    "cetirizine": "Antihistamine for allergy symptoms like runny nose, sneezing, and itching.",
    "cetzine": "Cetirizine tablet for allergic rhinitis and itching.",
    "okacet": "Cetirizine antihistamine for allergies.",
    "levocetirizine": "Non-drowsy antihistamine for persistent allergies.",
    "montelukast": "Leukotriene receptor antagonist for asthma and allergic rhinitis.",
    "metformin": "First-line oral anti-diabetic medication to control blood sugar levels.",
    "glycomet": "Contains Metformin for Type 2 diabetes control.",
    "atorvastatin": "Statin medication used to lower LDL cholesterol and protect heart health.",
    "atorva": "Atorvastatin cholesterol-lowering medication.",
    "amlodipine": "Calcium channel blocker used to control high blood pressure (hypertension).",
    "stamlo": "Contains Amlodipine for high blood pressure.",
    "telmisartan": "Angiotensin receptor blocker (ARB) for blood pressure control.",
    "telma": "Telmisartan blood pressure medication.",
    "orsl": "Oral Rehydration Salt solution to restore electrolyte balance during dehydration.",
    "electral": "Oral rehydration salts for dehydration and fluid loss recovery."
}

def get_medicine_info(med_name):
    """Retrieve safe general informational summary for a medicine name."""
    clean = re.sub(r'[^a-zA-Z]', '', med_name).lower()
    for key, desc in MEDICINE_PURPOSE_KNOWLEDGE.items():
        if key in clean or clean in key:
            return desc
    return f"Prescribed medication ({med_name}). Follow timings and dosage as instructed by your physician."


def normalize_ocr_text(text):
    """Normalize common OCR typos in handwriting and medical prescriptions."""
    if not text:
        return ""
    # Normalize units: m3/rn3/n1g/m9 -> mg
    text = re.sub(r'\b(\d+(\.\d+)?)\s*(m3|rn3|n1g|nng|rnp|m9)\b', r'\1 mg', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(\d+(\.\d+)?)\s*(n1l|rn1l)\b', r'\1 ml', text, flags=re.IGNORECASE)
    # Normalize Rx prefixes: 7ab / 1ab / Tal: -> Tab.
    text = re.sub(r'\b(7ab|1ab|Tal:|7al:|Tali|Tah|Tabi)\b', 'Tab.', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(Caj|Cop|Caj:|Capi)\b', 'Cap.', text, flags=re.IGNORECASE)
    # Normalize frequencies: l-0-l / 1-o-1 -> 1-0-1
    text = re.sub(r'\b(l-0-l|1-o-1|1-O-1|l-o-l)\b', '1-0-1', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(1-o-0|1-O-0|l-0-0)\b', '1-0-0', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(0-o-1|0-O-1|0-0-l)\b', '0-0-1', text, flags=re.IGNORECASE)
    return text


def extract_all_medicines_structured(full_text):
    """
    High-Recall Candidate Extraction Mechanism:
    Parses COMPLETE OCR text using sliding line windows and pattern matching.
    Does NOT depend on a giant lookup database or rigid validation filters.
    Performs per-medicine confidence classification with verification warnings.
    """
    if not full_text or not full_text.strip():
        print("[MEDICINE] Extraction started: Empty input text")
        return [], "No text could be extracted from this document."

    norm_text = normalize_ocr_text(full_text)
    lines = [l.strip() for l in norm_text.splitlines() if l.strip()]
    print(f"[MEDICINE] High-recall extraction started on {len(lines)} OCR text lines")

    dose_pattern = re.compile(r'\b(\d+(\.\d+)?\s*(mg|g|ml|mcg|iu|sachet|tsp|tab|tablet|cap|capsule|pills|%))\b', re.IGNORECASE)
    freq_pattern = re.compile(r'\b(1-0-1|1-0-0|0-0-1|1-1-1|0-1-0|2-0-2|once daily|twice daily|thrice daily|bd|tds|od|hs|subah|shaam|after meal|before meal|before breakfast|every \d+ hours|\d+-\d+-\d+|sos|stat)\b', re.IGNORECASE)
    dur_pattern = re.compile(r'\b(\d+\s*(days|day|weeks|week|months|month|for \d+ days))\b', re.IGNORECASE)
    form_prefix_pattern = re.compile(r'^\s*(tab|tablet|cap|capsule|syrup|syr|inj|injection|gel|ointment|cream|drops|sachet|lotion|adv)\b[\.\s]*', re.IGNORECASE)

    # Build sliding window blocks (1-line, 2-line, 3-line combinations)
    candidate_blocks = []
    for l in lines:
        candidate_blocks.append(l)
    for i in range(len(lines) - 1):
        candidate_blocks.append(f"{lines[i]} {lines[i+1]}")
    for i in range(len(lines) - 2):
        candidate_blocks.append(f"{lines[i]} {lines[i+1]} {lines[i+2]}")

    extracted_medicines = []
    seen_keys = set()
    stop_words = {
        "take", "stat", "sos", "daily", "oral", "po", "after", "before", "meal", "breakfast",
        "dinner", "day", "days", "tab", "tablet", "cap", "capsule", "syrup", "syr", "sex",
        "age", "name", "date", "dr", "doctor", "patient", "male", "female", "yrs", "years", "adv"
    }

    for block in candidate_blocks:
        line_lower = block.lower()

        # Skip obvious administrative headers unless block contains clear medicine patterns
        if any(h in line_lower for h in NON_MEDICINE_HEADERS) and not dose_pattern.search(block) and not freq_pattern.search(block):
            continue

        has_dose = dose_pattern.search(block)
        has_freq = freq_pattern.search(block)
        has_prefix = form_prefix_pattern.search(block)
        has_rx_marker = bool(re.search(r'\b(tab|cap|syp|mg|sos|adv|\d+[\.\)])\b', block, re.IGNORECASE))

        if has_dose or has_freq or has_prefix or has_rx_marker:
            dosage = has_dose.group(0) if has_dose else ""
            frequency = has_freq.group(0) if has_freq else ""
            dur_match = dur_pattern.search(block)
            duration = dur_match.group(0) if dur_match else ""

            # Clean block to extract medicine name
            clean_block = re.sub(r'^\d+[\.\)]\s*', '', block).strip()
            clean_name = form_prefix_pattern.sub('', clean_block).strip()

            name_part = clean_name
            if dosage:
                name_part = name_part.replace(dosage, '')
            if frequency:
                name_part = name_part.replace(frequency, '')
            if duration:
                name_part = name_part.replace(duration, '')

            name_part = re.sub(r'^[^\w]+|[^\w]+$', '', name_part).strip()

            tokens = [t for t in name_part.split() if len(t) >= 2 and not t.isdigit() and t.lower() not in stop_words and not any(h == t.lower() for h in NON_MEDICINE_HEADERS)]

            if not tokens:
                continue

            raw_med_token = " ".join(tokens[:2])
            canonical_candidate = raw_med_token.capitalize()

            # Fuzzy match against known medicine purpose dictionary if similarity > 65%
            matched_known = False
            for known_key in MEDICINE_PURPOSE_KNOWLEDGE.keys():
                if fuzz.ratio(known_key, raw_med_token.lower()) > 65 or fuzz.partial_ratio(known_key, raw_med_token.lower()) > 80:
                    canonical_candidate = known_key.capitalize()
                    matched_known = True
                    break

            key = canonical_candidate.lower()

            # Calculate individual medicine confidence rating
            if has_dose and has_freq and matched_known:
                conf = 0.92
            elif has_dose or has_freq:
                conf = 0.85 if matched_known else 0.72
            elif matched_known:
                conf = 0.78
            elif len(canonical_candidate) >= 4:
                conf = 0.58
            else:
                conf = 0.42

            # Assign verification label & warning based on confidence
            if conf >= 0.75:
                conf_label = "High"
                warning = ""
            elif conf >= 0.50:
                conf_label = "Medium"
                warning = "Please verify manually"
            else:
                conf_label = "Low"
                warning = "Possible medicine — please verify"

            # Check if candidate already exists to merge attributes
            existing_match = next((item for item in extracted_medicines if item["name"].lower() == key or item["medicine"].lower() == key), None)
            if existing_match:
                if not existing_match["strength"] and dosage:
                    existing_match["strength"] = dosage
                    existing_match["dosage"] = dosage
                if not existing_match["frequency"] and frequency:
                    existing_match["frequency"] = frequency
                if not existing_match["duration"] and duration:
                    existing_match["duration"] = duration
            elif key not in seen_keys and len(canonical_candidate) >= 2:
                seen_keys.add(key)
                info = get_medicine_info(canonical_candidate)

                extracted_medicines.append({
                    "name": canonical_candidate,
                    "medicine": canonical_candidate,
                    "strength": dosage,
                    "dosage": dosage,
                    "frequency": frequency,
                    "duration": duration,
                    "confidence": conf,
                    "confidence_label": conf_label,
                    "verification_warning": warning,
                    "info": info,
                    "raw_line": block
                })

    print(f"[MEDICINE] Candidates detected: {len(extracted_medicines)}")
    print(f"[MEDICINE] Final medicines count: {len(extracted_medicines)}")

    # Generate Audio Script combining ALL extracted medicines and instructions
    audio_parts = []
    if len(extracted_medicines) > 0:
        med_count_str = f"Your prescription contains {len(extracted_medicines)} identified medication candidate{'s' if len(extracted_medicines) > 1 else ''}."
        audio_parts.append(med_count_str)

        for i, item in enumerate(extracted_medicines, start=1):
            name = item['name']
            strength = item['strength'] or ''
            freq = item['frequency'] or ''
            dur = item['duration'] or ''
            info = item['info']

            item_script = f"Number {i}: {name} {strength}."
            if freq:
                item_script += f" Frequency {freq}."
            if dur:
                item_script += f" For {dur}."
            item_script += f" {info}"
            audio_parts.append(item_script)

        audio_parts.append("Please verify all medications with your physician or pharmacist.")
    else:
        audio_parts.append("No medicines could be confidently identified from this prescription. Please consult your doctor or upload a clearer photo.")

    audio_script = " ".join(audio_parts)

    return extracted_medicines, audio_script


def extract_medicines_with_ollama_fallback(extracted_text):
    """
    Convenience wrapper returning extracted medicines & audio script.
    """
    meds, audio_script = extract_all_medicines_structured(extracted_text)
    return meds, "structured_icr_parser", audio_script


def extract_ALL_medicines_from_prescription(full_text):
    """
    Alias wrapper returning all extracted candidate medicines.
    """
    meds, _ = extract_all_medicines_structured(full_text)
    return meds

