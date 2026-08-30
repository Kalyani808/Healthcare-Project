import urllib.request
import urllib.parse
import json
import re
import logging
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

# Common brand-to-generic active ingredient mappings (especially for Indian formulations)
COMMON_GENERIC_MAP = {
    "dolo": "paracetamol",
    "crocin": "paracetamol",
    "calpol": "paracetamol",
    "pacimol": "paracetamol",
    "pan": "pantoprazole",
    "pantocid": "pantoprazole",
    "pantop": "pantoprazole",
    "pantodac": "pantoprazole",
    "pan-d": "pantoprazole + domperidone",
    "augmentin": "amoxicillin + clavulanate",
    "moxikind": "amoxicillin + clavulanate",
    "mox": "amoxicillin",
    "novamox": "amoxicillin",
    "brufen": "ibuprofen",
    "combiflam": "ibuprofen + paracetamol",
    "voveran": "diclofenac",
    "diclogesic": "diclofenac",
    "telma": "telmisartan",
    "telmikind": "telmisartan",
    "telsartan": "telmisartan",
    "stamlo": "amlodipine",
    "amlong": "amlodipine",
    "amlovas": "amlodipine",
    "glycomet": "metformin",
    "cetcip": "cetirizine",
    "cetzine": "cetirizine",
    "allegra": "fexofenadine",
    "azithral": "azithromycin",
    "azee": "azithromycin",
    "ranitidine": "ranitidine",
    "rantac": "ranitidine",
    "aciloc": "ranitidine",
    "omeez": "omeprazole",
    "omez": "omeprazole",
    "aspirin": "aspirin",
    "ecosprin": "aspirin",
    "warfarin": "warfarin",
    "warf": "warfarin"
}

_DRUG_TERM_CACHE = {}
_INTERACTION_CACHE = {}

class DrugInteractionService:
    """
    Real-time drug-drug interaction and duplicate therapy checker
    using public, free NIH RxNorm and openFDA Drug Label APIs.
    """

    CLEAN_PREFIX_REGEX = re.compile(
        r'\b(tab|tablets?|caps?|capsules?|syrup|syp|inj|injection|oint|ointment|drops?|cream|gel|susp|suspension)\b',
        re.IGNORECASE
    )
    CLEAN_DOSAGE_REGEX = re.compile(r'\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%)\b', re.IGNORECASE)

    @classmethod
    def clean_drug_name(cls, raw_name):
        """Clean raw OCR/extracted medicine name down to candidate core name."""
        if not raw_name:
            return ""
        name = str(raw_name).strip()
        name = cls.CLEAN_PREFIX_REGEX.sub('', name)
        name = cls.CLEAN_DOSAGE_REGEX.sub('', name)
        name = re.sub(r'[^\w\s]', ' ', name).strip()
        return re.sub(r'\s+', ' ', name).strip()

    @classmethod
    def resolve_rxcui(cls, raw_name):
        """
        Normalize extracted medicine name to canonical active ingredient & NIH RxNorm concept.
        """
        cleaned = cls.clean_drug_name(raw_name)
        if not cleaned or len(cleaned) < 2:
            return {"matched": False, "raw_name": raw_name, "reason": "Name too short or empty"}

        cache_key = cleaned.lower()
        if cache_key in _DRUG_TERM_CACHE:
            return _DRUG_TERM_CACHE[cache_key]

        # 1. Check known brand-to-generic mapping
        first_token = cleaned.lower().split()[0]
        if first_token in COMMON_GENERIC_MAP:
            generic_name = COMMON_GENERIC_MAP[first_token]
            result = {
                "matched": True,
                "raw_name": raw_name,
                "cleaned_name": cleaned,
                "canonical_name": generic_name.title(),
                "active_ingredient": generic_name.lower(),
                "rxcui": "KNOWN_GENERIC",
                "source": "Clinical Formulation Knowledge Base"
            }
            _DRUG_TERM_CACHE[cache_key] = result
            return result

        # 2. Query NIH RxNorm Approximate Term API
        encoded_term = urllib.parse.quote(cleaned)
        url = f"https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term={encoded_term}&maxEntries=3"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "SevaHealth-App/1.0", "Accept": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                candidates = data.get('approximateGroup', {}).get('candidate', [])
                if candidates:
                    top = candidates[0]
                    score = float(top.get('score', 0))
                    if score >= 5.0 or len(candidates) == 1:
                        rxcui = str(top.get('rxcui'))
                        canonical_name = cls._fetch_rxcui_name(rxcui) or cleaned.title()
                        result = {
                            "matched": True,
                            "raw_name": raw_name,
                            "cleaned_name": cleaned,
                            "canonical_name": canonical_name.title(),
                            "active_ingredient": canonical_name.lower(),
                            "rxcui": rxcui,
                            "score": score,
                            "source": "NIH RxNorm Database"
                        }
                        _DRUG_TERM_CACHE[cache_key] = result
                        return result

            # Unmatched / Ambiguous
            result = {
                "matched": False,
                "raw_name": raw_name,
                "cleaned_name": cleaned,
                "reason": "No confident match in drug interaction database"
            }
            _DRUG_TERM_CACHE[cache_key] = result
            return result
        except Exception as e:
            logger.warning(f"RxNorm lookup failed for {cleaned}: {e}")
            return {
                "matched": False,
                "raw_name": raw_name,
                "cleaned_name": cleaned,
                "reason": f"API error: {str(e)}"
            }

    @classmethod
    def _fetch_rxcui_name(cls, rxcui):
        """Fetch canonical name for a given RxCUI."""
        try:
            url = f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/properties.json"
            req = urllib.request.Request(url, headers={"User-Agent": "SevaHealth/1.0", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                props = data.get('properties', {})
                return props.get('name')
        except Exception:
            return None

    @classmethod
    def check_openfda_pairwise_interaction(cls, drug_a, drug_b):
        """
        Check openFDA drug label interactions between drug_a and drug_b.
        """
        # Strip combo ingredients for individual API queries if needed
        primary_a = drug_a.split('+')[0].strip()
        primary_b = drug_b.split('+')[0].strip()

        pair_key = tuple(sorted([primary_a.lower(), primary_b.lower()]))
        if pair_key in _INTERACTION_CACHE:
            return _INTERACTION_CACHE[pair_key]

        # Query openFDA label API
        query = urllib.parse.quote(
            f'drug_interactions:"{primary_b}" AND (openfda.generic_name:"{primary_a}" OR openfda.brand_name:"{primary_a}")'
        )
        url = f"https://api.fda.gov/drug/label.json?search={query}&limit=1"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "SevaHealth/1.0", "Accept": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                results = data.get('results', [])
                if results:
                    interaction_snippets = results[0].get('drug_interactions', [])
                    if interaction_snippets:
                        raw_snippet = interaction_snippets[0]
                        sentences = re.split(r'\.\s+', raw_snippet)
                        matching = [s.strip() for s in sentences if primary_b.lower() in s.lower()]
                        description = ". ".join(matching[:2]) if matching else raw_snippet[:250]
                        
                        desc_lower = description.lower()
                        if any(k in desc_lower for k in ['fatal', 'contraindicated', 'severe', 'bleeding', 'toxicity', 'arrhythmia', 'qt prolongation']):
                            severity = "major"
                        elif any(k in desc_lower for k in ['moderate', 'monitor', 'decrease', 'increase', 'caution', 'adjust']):
                            severity = "moderate"
                        else:
                            severity = "caution"

                        res = {
                            "found": True,
                            "drug_a": drug_a,
                            "drug_b": drug_b,
                            "severity": severity,
                            "title": f"Interaction Warning: {drug_a} + {drug_b}",
                            "description": description.strip() + ("." if not description.endswith('.') else ""),
                            "source": "openFDA Official Drug Label Database"
                        }
                        _INTERACTION_CACHE[pair_key] = res
                        return res
        except Exception:
            pass

        # Reverse check
        try:
            query_rev = urllib.parse.quote(
                f'drug_interactions:"{primary_a}" AND (openfda.generic_name:"{primary_b}" OR openfda.brand_name:"{primary_b}")'
            )
            url_rev = f"https://api.fda.gov/drug/label.json?search={query_rev}&limit=1"
            req_rev = urllib.request.Request(url_rev, headers={"User-Agent": "SevaHealth/1.0", "Accept": "application/json"})
            with urllib.request.urlopen(req_rev, timeout=6) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                results = data.get('results', [])
                if results:
                    interaction_snippets = results[0].get('drug_interactions', [])
                    if interaction_snippets:
                        raw_snippet = interaction_snippets[0]
                        sentences = re.split(r'\.\s+', raw_snippet)
                        matching = [s.strip() for s in sentences if primary_a.lower() in s.lower()]
                        description = ". ".join(matching[:2]) if matching else raw_snippet[:250]
                        
                        desc_lower = description.lower()
                        severity = "major" if any(k in desc_lower for k in ['fatal', 'contraindicated', 'severe', 'bleeding', 'toxicity']) else "moderate"

                        res = {
                            "found": True,
                            "drug_a": drug_a,
                            "drug_b": drug_b,
                            "severity": severity,
                            "title": f"Interaction Warning: {drug_a} + {drug_b}",
                            "description": description.strip() + ("." if not description.endswith('.') else ""),
                            "source": "openFDA Official Drug Label Database"
                        }
                        _INTERACTION_CACHE[pair_key] = res
                        return res
        except Exception:
            pass

        res = {"found": False, "drug_a": drug_a, "drug_b": drug_b}
        _INTERACTION_CACHE[pair_key] = res
        return res

    @classmethod
    def check_duplicate_therapy(cls, resolved_drugs):
        """
        Detect duplicate therapies (e.g. multiple medicines with same active ingredient).
        """
        duplicates = []
        seen_ingredients = {}

        for drug in resolved_drugs:
            if not drug.get('matched'):
                continue
            ingredient = drug.get('active_ingredient', drug.get('canonical_name', '')).lower()
            if not ingredient:
                continue

            # Check exact or overlapping ingredient match
            for prev_ing, prev_drug in seen_ingredients.items():
                if prev_ing == ingredient or (len(ingredient) > 3 and prev_ing in ingredient) or (len(prev_ing) > 3 and ingredient in prev_ing):
                    duplicates.append({
                        "drug_a": prev_drug['raw_name'],
                        "drug_b": drug['raw_name'],
                        "severity": "moderate",
                        "title": f"Duplicate Therapy Warning: {drug['canonical_name']}",
                        "description": (
                            f"Both '{prev_drug['raw_name']}' and '{drug['raw_name']}' contain active ingredient "
                            f"{drug['canonical_name']}. Taking duplicate medications may lead to accidental overdose. "
                            f"Confirm with your physician or pharmacist before taking both."
                        ),
                        "source": "NIH RxNorm & Pharmacology Formulation Cross-Check"
                    })
            seen_ingredients[ingredient] = drug

        return duplicates

    @classmethod
    def check_all_interactions(cls, medicines_list):
        """
        Full pipeline:
        1. Resolves all medicines to active ingredient / RxNorm concept in parallel.
        2. Performs pairwise openFDA interaction checks.
        3. Identifies duplicate therapies.
        4. Identifies unmatched medicines.
        """
        if not medicines_list or len(medicines_list) < 2:
            return {
                "checked": False,
                "message": "At least 2 medicines are required to check drug interactions.",
                "interactions": [],
                "duplicates": [],
                "unmatched_medicines": []
            }

        raw_names = []
        for m in medicines_list:
            n = m.get('name') or m.get('medicine') or m.get('medicine_name') if isinstance(m, dict) else str(m)
            if n:
                raw_names.append(n)

        resolved_drugs = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            resolved_drugs = list(executor.map(cls.resolve_rxcui, raw_names))

        matched_drugs = [d for d in resolved_drugs if d.get('matched')]
        unmatched_drugs = [d for d in resolved_drugs if not d.get('matched')]

        # Pairwise interactions in parallel
        pairs = []
        for i in range(len(matched_drugs)):
            for j in range(i + 1, len(matched_drugs)):
                pairs.append((matched_drugs[i]['canonical_name'], matched_drugs[j]['canonical_name']))

        interactions = []
        if pairs:
            with ThreadPoolExecutor(max_workers=5) as executor:
                inter_results = list(executor.map(lambda p: cls.check_openfda_pairwise_interaction(p[0], p[1]), pairs))
            interactions = [it for it in inter_results if it.get('found')]

        # Duplicate therapy check
        duplicates = cls.check_duplicate_therapy(matched_drugs)

        has_warnings = len(interactions) > 0 or len(duplicates) > 0
        has_major = any(it.get('severity') == 'major' for it in interactions)

        return {
            "checked": True,
            "total_medicines": len(raw_names),
            "matched_count": len(matched_drugs),
            "unmatched_count": len(unmatched_drugs),
            "matched_medicines": matched_drugs,
            "unmatched_medicines": [
                {
                    "name": u.get('raw_name'),
                    "message": "Interaction check unavailable for this medicine (unresolved in RxNorm)"
                }
                for u in unmatched_drugs
            ],
            "has_warnings": has_warnings,
            "has_major_interactions": has_major,
            "interactions": interactions,
            "duplicates": duplicates
        }
