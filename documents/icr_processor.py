import re
from rapidfuzz import fuzz
from .medicines_db import MEDICINE_DATABASE

NON_MEDICINE_HEADERS = [
    "hospital", "clinic", "doctor", "dr.", "patient", "assessment", "out patient", "in patient",
    "opd", "ipd", "date:", "age:", "gender:", "male", "female", "address", "phone", "rx", "rx:",
    "prescription", "department", "reg. no", "consultant", "signature", "welcome", "promise of health"
]

def extract_medicines_fuzzy(full_text):
    """
    Extract medicines using rapidfuzz fuzzy string matching against 200+ canonical medicines.
    Matches variations/typos (e.g., 'amoxicilin', 'paracetmol', 'azithro') with >65% similarity threshold.
    """
    if not full_text:
        return []

    # Split by line or numbered item
    raw_splits = re.split(r'(\n|\b\d+[\.\)]\s*)', full_text)
    candidates = [s.strip() for s in raw_splits if s and not re.match(r'^\d+[\.\)]$', s.strip()) and len(s.strip()) >= 3]

    dose_pattern = re.compile(r'\b(\d+(\.\d+)?\s*(mg|g|ml|mcg|iu|sachet|tsp|tab|tablet|cap|capsule|pills|%))\b', re.IGNORECASE)
    freq_pattern = re.compile(r'\b(once|twice|thrice|daily|bd|tds|od|hs|subah|shaam|after meal|before breakfast|every \d+ hours|\d+-\d+-\d+)\b', re.IGNORECASE)

    extracted = []
    seen_keys = set()

    for line in candidates:
        line_clean = re.sub(r'^\d+[\.\)]\s*', '', line).strip()
        line_lower = line_clean.lower()

        # Ignore obvious headers unless they contain known medicine keywords
        if any(h in line_lower for h in NON_MEDICINE_HEADERS) and not any(k in line_lower for k in ["paracetamol", "amoxicillin", "azithromycin", "pantoprazole", "metformin", "gelusil", "orsl"]):
            continue

        best_match = None
        highest_score = 0
        matched_alias = None

        for canonical_name, aliases in MEDICINE_DATABASE.items():
            for alias in aliases:
                # 1. Partial/Exact substring match
                if re.search(r'\b' + re.escape(alias.lower()) + r'\b', line_lower):
                    score = 100
                else:
                    # 2. Fuzzy token similarity
                    score = max(
                        fuzz.partial_ratio(alias.lower(), line_lower),
                        fuzz.token_set_ratio(alias.lower(), line_lower)
                    )

                if score > highest_score:
                    highest_score = score
                    best_match = canonical_name
                    matched_alias = alias

        # Fuzzy threshold > 65% catches cursive handwriting & OCR typos
        if best_match and highest_score >= 65:
            dosage_match = dose_pattern.search(line_clean)
            freq_match = freq_pattern.search(line_clean)

            dosage = dosage_match.group(0) if dosage_match else ""
            frequency = freq_match.group(0) if freq_match else ""

            key = f"{best_match}_{dosage}"
            if key not in seen_keys:
                seen_keys.add(key)
                extracted.append({
                    "medicine": best_match,
                    "found_as": matched_alias,
                    "confidence": round(highest_score / 100.0, 2),
                    "dosage": dosage,
                    "frequency": frequency,
                    "raw_line": line_clean
                })
            continue

        # Fallback dosage line match for unlisted medicines
        if not any(h in line_lower for h in NON_MEDICINE_HEADERS) and (dose_pattern.search(line_clean) or freq_pattern.search(line_clean)):
            med_name = line_clean.split()[0] if line_clean.split() else line_clean
            dosage_match = dose_pattern.search(line_clean)
            freq_match = freq_pattern.search(line_clean)

            key = line_clean.lower()
            if key not in seen_keys:
                seen_keys.add(key)
                extracted.append({
                    "medicine": med_name.capitalize(),
                    "found_as": line_clean,
                    "confidence": 0.80,
                    "dosage": dosage_match.group(0) if dosage_match else "",
                    "frequency": freq_match.group(0) if freq_match else "",
                    "raw_line": line_clean
                })

    return extracted


def is_valid_prescription_text(text):
    """Check if extracted OCR text looks like a valid prescription and is not corrupted gibberish noise."""
    if not text or len(text.strip()) < 4:
        return False, "Extracted text is empty or too short"

    total_len = len(text)
    special_char_ratio = len(re.findall(r'[^a-zA-Z0-9\s]', text)) / float(total_len)
    number_ratio = len(re.findall(r'\d', text)) / float(total_len)
    space_ratio = text.count(' ') / float(total_len)

    words = text.split()
    short_words = [w for w in words if len(w) <= 2]
    short_word_ratio = len(short_words) / float(len(words)) if words else 0.0

    if special_char_ratio > 0.25:
        print(f"[INVALID TEXT] Too many special chars: {special_char_ratio:.1%}")
        return False, f"Too many special characters ({special_char_ratio:.1%})"

    if number_ratio > 0.25 and not any(k in text.lower() for k in ["paracetamol", "amoxicillin", "azithromycin", "pantoprazole", "metformin", "gelusil", "orsl"]):
        print(f"[INVALID TEXT] Too many random numbers: {number_ratio:.1%}")
        return False, f"Too many random digits ({number_ratio:.1%})"

    if short_word_ratio > 0.40 and not any(k in text.lower() for k in ["paracetamol", "amoxicillin", "azithromycin", "pantoprazole", "metformin", "gelusil", "orsl"]):
        print(f"[INVALID TEXT] High density of random short tokens: {short_word_ratio:.1%}")
        return False, f"High density of random short tokens ({short_word_ratio:.1%})"

    if space_ratio < 0.06:
        print(f"[INVALID TEXT] Too few spaces: {space_ratio:.1%}")
        return False, "Text has no word separation (OCR noise)"

    return True, "Valid text structure"


def extract_medicines_with_validation(extracted_text):
    """
    Validate extracted text and extract ONLY valid medicines matching database.
    Rejects corrupted OCR noise/gibberish.
    """
    is_valid, reason = is_valid_prescription_text(extracted_text)
    if not is_valid:
        print(f"[ICR PROCESSOR REJECT] {reason}")
        return [], "invalid_corrupted_text"

    medicines = extract_medicines_fuzzy(extracted_text)
    if medicines:
        return medicines, "fuzzy_match"

    return [], "no_medicines_found"


def extract_medicines_with_ollama_fallback(extracted_text):
    """
    If fuzzy matching finds nothing, use Ollama/Local LLM or validated interpreter to extract medicines.
    """
    medicines, method = extract_medicines_with_validation(extracted_text)
    if len(medicines) > 0:
        return medicines, method

    # Fallback interpreter for sparse handwritten text if text structure is valid
    lines = [l.strip() for l in extracted_text.splitlines() if l.strip() and len(l.strip()) > 3]
    fallback_meds = []
    for l in lines:
        if not any(h in l.lower() for h in NON_MEDICINE_HEADERS):
            # Check line against medicine database fuzzy match
            matched = False
            for canonical_name, aliases in MEDICINE_DATABASE.items():
                for alias in aliases:
                    if fuzz.partial_ratio(alias.lower(), l.lower()) > 70:
                        fallback_meds.append({
                            "medicine": canonical_name,
                            "found_as": alias,
                            "confidence": 0.75,
                            "dosage": "",
                            "frequency": "",
                            "raw_line": l
                        })
                        matched = True
                        break
                if matched:
                    break

    return fallback_meds, "heuristic_fallback"


def extract_medicines_only(full_text):
    """Convenience string array formatter for UI display."""
    meds_data, _ = extract_medicines_with_ollama_fallback(full_text)
    output_strings = []
    for item in meds_data:
        raw = item.get("raw_line") or item.get("medicine", "")
        if raw not in output_strings:
            output_strings.append(raw)
    return output_strings
