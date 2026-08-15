import os
import json
import logging
import urllib.request
import ollama

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EXTRACTION_MODEL = os.getenv("OLLAMA_EXTRACTION_MODEL", "mistral")

class MistralExtractionService:
    def __init__(self, base_url=OLLAMA_BASE_URL, default_model=OLLAMA_EXTRACTION_MODEL):
        self.base_url = base_url.rstrip('/')
        self.default_model = default_model

    def check_ollama_availability(self):
        try:
            url = f"{self.base_url}/api/tags"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    models = [m.get('name', '').split(':')[0] for m in data.get('models', [])]
                    models_full = [m.get('name', '') for m in data.get('models', [])]
                    return True, list(set(models + models_full))
        except Exception as e:
            logger.warning(f"[OLLAMA MISTRAL CHECK] Ollama unreachable: {str(e)}")
        return False, []

    def extract_medicines(self, raw_ocr_text):
        """
        Extract structured medicine entries from raw prescription OCR text using local Mistral 7B via Ollama.
        """
        if not raw_ocr_text or not raw_ocr_text.strip():
            return [], "No OCR text provided for extraction."

        is_running, available_models = self.check_ollama_availability()
        model_name = self.default_model if any(self.default_model in m for m in available_models) else "mistral:latest"

        if is_running and any("mistral" in m for m in available_models):
            print(f"[MISTRAL EXTRACTION] Parsing OCR text using local model: {model_name}")
            prompt = f"""You are an expert clinical prescription parser. Extract ALL prescribed medicine entries from the raw OCR text into a structured JSON array.

STRICT EXTRACTION RULES:
1. Extract EVERY medicine entry present in the OCR text.
2. DO NOT invent or hallucinate missing strengths or durations if they are not in the text. Leave empty string "" if missing.
3. DO NOT classify doctor names (e.g. Dr. Sharma), patient names (e.g. Aman, Pooja), clinic/hospital headers, or blood pressure readings (e.g. 120/80, 130/85) as medicines.
4. Understand prescription dosage notation: 1-0-1 (twice daily), 1-0-0 (morning), 0-0-1 (night), 1-1-1 (thrice daily), BD, OD, TDS, HS.
5. Provide timing details (e.g. "after meal", "30 min before breakfast") when present.
6. Provide a numerical confidence score (0.0 to 1.0) for each extracted item.

Return ONLY valid JSON matching this exact structure:
{{
  "medicines": [
    {{
      "name": "Augmentin",
      "raw_text": "Tab. Augmentin 625mg 1-0-1",
      "strength": "625 mg",
      "frequency": "1-0-1",
      "duration": "5 days",
      "timing": "after meal",
      "confidence": 0.95
    }}
  ]
}}

RAW PRESCRIPTION OCR TEXT:
{raw_ocr_text}
"""

            try:
                response = ollama.chat(
                    model=model_name,
                    messages=[{'role': 'user', 'content': prompt}],
                    format='json',
                    options={'temperature': 0.0}
                )

                content = response.get('message', {}).get('content', '').strip()
                if content:
                    parsed = json.loads(content)
                    raw_medicines = parsed.get("medicines", [])

                    formatted_medicines = []
                    for item in raw_medicines:
                        name = item.get("name", "").strip()
                        if not name or len(name) < 2:
                            continue

                        # Exclude obvious non-medicines
                        name_lower = name.lower()
                        if any(h in name_lower for h in ["dr.", "doctor", "patient", "clinic", "hospital", "date", "blood pressure", "120/80", "130/80"]):
                            continue

                        conf = float(item.get("confidence", 0.85))
                        if conf >= 0.75:
                            conf_label = "High"
                            warning = ""
                        elif conf >= 0.50:
                            conf_label = "Medium"
                            warning = "Please verify manually"
                        else:
                            conf_label = "Low"
                            warning = "Possible medicine — please verify"

                        formatted_medicines.append({
                            "name": name.capitalize(),
                            "medicine": name.capitalize(),
                            "raw_text": item.get("raw_text", ""),
                            "strength": item.get("strength", ""),
                            "dosage": item.get("strength", ""),
                            "frequency": item.get("frequency", ""),
                            "duration": item.get("duration", ""),
                            "timing": item.get("timing", ""),
                            "confidence": conf,
                            "confidence_label": conf_label,
                            "verification_warning": warning
                        })

                    print(f"[MISTRAL SUCCESS] Extracted {len(formatted_medicines)} medicines via local Mistral")
                    return formatted_medicines, "ollama_mistral_json"
            except Exception as e:
                print(f"[MISTRAL ERROR] Mistral extraction failed: {str(e)}")

        # Heuristic fallback if Ollama/Mistral is offline
        print("[MISTRAL FALLBACK] Local Ollama Mistral unavailable. Falling back to heuristic line parser...")
        from ..icr_processor import extract_all_medicines_structured
        medicines, _ = extract_all_medicines_structured(raw_ocr_text)
        return medicines, "heuristic_line_parser_fallback"
