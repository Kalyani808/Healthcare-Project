import os
import json
import logging
import urllib.request
import re
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
            prompt = f"""You are an expert clinical prescription parser. Extract prescribed medicine entries from the raw OCR text into a structured JSON array.

STRICT CLINICAL SAFETY RULES:
1. DO NOT guess or hallucinate closest-sounding medicine names if the OCR text is garbled, fragmented, or noisy.
2. If a line is garbled or uncertain (e.g. "Nloclon", "Feleccexi", "Sncfta"), set "name": null and "confidence": 0.3. DO NOT map it to a guessed drug like "Clonazepam" or "Enorfloxacin". A wrong medicine name is a severe patient safety hazard.
3. Only assign confidence >= 0.80 if the medicine name is clearly legible and unambiguous in the OCR text (e.g., "Amoxicillin", "Paracetamol", "Augmentin").
4. DO NOT classify doctor names, patient names, clinic headers, or blood pressure readings (e.g., 120/70) as medicines.
5. Provide strength, frequency (1-0-1, BD, OD, HS), duration, and timing when present.

FEW-SHOT EXAMPLES:
Input OCR Line: "Tab. Amoxicillin 250mg 1-0-1 for 5 days"
Output: {{"name": "Amoxicillin", "raw_text": "Tab. Amoxicillin 250mg 1-0-1", "strength": "250 mg", "frequency": "1-0-1", "duration": "5 days", "timing": "after meal", "confidence": 0.95}}

Input OCR Line: "Nloclon 500mg BD"
Output: {{"name": null, "raw_text": "Nloclon 500mg BD", "strength": "500 mg", "frequency": "BD", "duration": "", "timing": "", "confidence": 0.30}}

Return ONLY valid JSON matching this exact structure:
{{
  "medicines": [
    {{
      "name": "Amoxicillin",
      "raw_text": "Tab. Amoxicillin 250mg 1-0-1",
      "strength": "250 mg",
      "frequency": "1-0-1",
      "duration": "5 days",
      "timing": "after meal",
      "confidence": 0.95
    }},
    {{
      "name": null,
      "raw_text": "Nloclon 500mg BD",
      "strength": "500 mg",
      "frequency": "BD",
      "duration": "",
      "timing": "",
      "confidence": 0.30
    }}
  ]
}}

RAW PRESCRIPTION OCR TEXT:
{raw_ocr_text}
"""

            try:
                client = ollama.Client(host=self.base_url, timeout=120.0)
                response = client.chat(
                    model=model_name,
                    messages=[{'role': 'user', 'content': prompt}],
                    format='json',
                    options={'temperature': 0.0, 'num_predict': 512}
                )

                content = response.get('message', {}).get('content', '').strip()
                if content:
                    # Robust JSON repair for LLM responses
                    json_str = content
                    match = re.search(r'\{.*\}', content, re.DOTALL)
                    if match:
                        json_str = match.group(0)

                    # Remove trailing commas
                    json_str = re.sub(r',\s*([\}\]])', r'\1', json_str)

                    try:
                        parsed = json.loads(json_str)
                    except json.JSONDecodeError:
                        # Secondary fallback repair
                        json_str = re.sub(r'[\x00-\x1F\x7F]', '', json_str)
                        parsed = json.loads(json_str)

                    raw_medicines = parsed.get("medicines", [])
                    formatted_medicines = []

                    for item in raw_medicines:
                        name = item.get("name")
                        raw_text = item.get("raw_text") or item.get("raw_line") or ""
                        conf = float(item.get("confidence", 0.0))

                        # If name is None, empty, or confidence < 0.75 -> Pass to needs_verification
                        if not name or len(str(name).strip()) < 2 or conf < 0.75:
                            formatted_medicines.append({
                                "name": None,
                                "raw_text": raw_text or str(name or ""),
                                "strength": item.get("strength", ""),
                                "frequency": item.get("frequency", ""),
                                "duration": item.get("duration", ""),
                                "confidence": conf
                            })
                            continue

                        clean_name = str(name).strip()
                        name_lower = clean_name.lower()

                        # Exclude non-medicines
                        if any(h in name_lower for h in ["dr.", "doctor", "patient", "clinic", "hospital", "date", "blood pressure", "120/80", "130/80", "120/70"]):
                            continue

                        formatted_medicines.append({
                            "name": clean_name.capitalize(),
                            "medicine": clean_name.capitalize(),
                            "raw_text": raw_text,
                            "strength": item.get("strength", ""),
                            "dosage": item.get("strength", ""),
                            "frequency": item.get("frequency", ""),
                            "duration": item.get("duration", ""),
                            "timing": item.get("timing", ""),
                            "confidence": conf,
                            "confidence_label": "High",
                            "verification_warning": ""
                        })

                    if formatted_medicines:
                        print(f"[MISTRAL SUCCESS] Extracted {len(formatted_medicines)} medicine items via local Mistral")
                        return formatted_medicines, "ollama_mistral_json"
            except Exception as e:
                print(f"[MISTRAL ERROR] Mistral extraction failed: {str(e)}")

        # Heuristic fallback if Ollama/Mistral is offline
        print("[MISTRAL FALLBACK] Local Ollama Mistral unavailable. Falling back to heuristic line parser...")
        from ..icr_processor import extract_all_medicines_structured
        medicines, _ = extract_all_medicines_structured(raw_ocr_text)
        return medicines, "heuristic_line_parser_fallback"
