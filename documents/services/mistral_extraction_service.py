import os
import json
import logging
import urllib.request
import socket
from .medicine_info_service import MedicineInfoService
from ..icr_processor import extract_all_medicines_structured

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EXTRACTION_MODEL = os.getenv("OLLAMA_EXTRACTION_MODEL", "mistral")

_OLLAMA_CHECK_CACHE = None

class MistralExtractionService:
    def __init__(self, base_url=OLLAMA_BASE_URL, default_model=OLLAMA_EXTRACTION_MODEL):
        self.base_url = base_url.rstrip('/')
        self.default_model = default_model

    def check_ollama_availability(self):
        global _OLLAMA_CHECK_CACHE
        if _OLLAMA_CHECK_CACHE is not None:
            return _OLLAMA_CHECK_CACHE

        try:
            # Fast socket check (50ms timeout) to avoid blocking
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.05)
            host = self.base_url.replace("http://", "").replace("https://", "").split(":")[0]
            port = int(self.base_url.split(":")[-1]) if ":" in self.base_url.replace("http://", "").replace("https://", "") else 11434
            res = s.connect_ex((host, port))
            s.close()
            if res != 0:
                _OLLAMA_CHECK_CACHE = (False, [])
                return False, []

            url = f"{self.base_url}/api/tags"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=0.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    models = [m.get('name', '').split(':')[0] for m in data.get('models', [])]
                    models_full = [m.get('name', '') for m in data.get('models', [])]
                    _OLLAMA_CHECK_CACHE = (True, list(set(models + models_full)))
                    return _OLLAMA_CHECK_CACHE
        except Exception:
            pass

        _OLLAMA_CHECK_CACHE = (False, [])
        return False, []

    def extract_medicines(self, raw_ocr_text):
        """
        Fast High-Precision Medicine Candidate Extraction.
        Instantly extracts medicine names, dosages, and 3-slot schedules from prescription OCR text.
        """
        if not raw_ocr_text or not raw_ocr_text.strip():
            return [], "empty_ocr_text"

        # Check if raw_ocr_text is JSON from Vision LLM
        clean_text = raw_ocr_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text.removeprefix("```json").removesuffix("```").strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text.removeprefix("```").removesuffix("```").strip()

        if clean_text.startswith("{") and "medicines" in clean_text:
            try:
                parsed_data = json.loads(clean_text)
                med_list = parsed_data.get("medicines", [])
                structured_meds = []
                for item in med_list:
                    med_name = item.get("name") or item.get("medicine") or ""
                    dosage = item.get("dosage") or item.get("strength") or ""
                    freq = item.get("frequency") or "1-0-1"
                    inst = item.get("instructions") or item.get("timing") or ""
                    conf = float(item.get("confidence") or item.get("confidence_score") or 0.95)

                    structured_meds.append({
                        "name": med_name.capitalize(),
                        "medicine": med_name.capitalize(),
                        "raw_text": f"{med_name} {dosage} {freq}",
                        "strength": dosage,
                        "dosage": dosage,
                        "frequency": freq,
                        "duration": item.get("duration", "for 5 days"),
                        "timing": inst or "after meal",
                        "confidence": conf,
                        "confidence_label": "High" if conf >= 0.75 else "Medium",
                        "verification_warning": "" if conf >= 0.75 else "Please verify manually",
                        "info": item.get("info", ""),
                    })
                if structured_meds:
                    return structured_meds, "vision_llm_json_parser"
            except Exception:
                pass

        # Check local Ollama Mistral LLM availability
        ollama_avail, models = self.check_ollama_availability()
        if ollama_avail and models:
            try:
                chosen_model = self.default_model if self.default_model in models else models[0]
                prompt = (
                    f"You are an expert medical prescription AI. Extract all prescribed medicines from this OCR text:\n"
                    f"```\n{raw_ocr_text}\n```\n"
                    f"Return ONLY JSON: {{\"medicines\": [{{\"name\": \"...\", \"dosage\": \"...\", \"frequency\": \"...\", \"duration\": \"...\", \"timing\": \"...\"}}]}}"
                )
                url = f"{self.base_url}/api/generate"
                payload = json.dumps({"model": chosen_model, "prompt": prompt, "stream": False, "format": "json"}).encode('utf-8')
                req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=5.0) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode('utf-8'))
                        response_str = data.get("response", "")
                        parsed_llm = json.loads(response_str)
                        llm_meds = parsed_llm.get("medicines", [])
                        if llm_meds:
                            structured_meds = []
                            for item in llm_meds:
                                mname = item.get("name", "").strip().title()
                                if mname:
                                    structured_meds.append({
                                        "name": mname,
                                        "medicine": mname,
                                        "strength": item.get("dosage", ""),
                                        "dosage": item.get("dosage", ""),
                                        "frequency": item.get("frequency", "1-0-1"),
                                        "duration": item.get("duration", "for 5 days"),
                                        "timing": item.get("timing", "after meal"),
                                        "confidence": 0.95,
                                        "confidence_label": "High",
                                        "verification_warning": "",
                                        "info": f"Prescribed therapeutic medication ({mname})."
                                    })
                            if structured_meds:
                                print(f"[OLLAMA {chosen_model.upper()} SUCCESS] Extracted {len(structured_meds)} medicines via Ollama LLM")
                                return structured_meds, f"ollama_{chosen_model}_llm"
            except Exception as o_err:
                print(f"[OLLAMA LLM FALLBACK] {o_err}")

        # Fast direct precision fuzzy dictionary matcher (< 5 milliseconds)
        medicines, method = extract_all_medicines_structured(raw_ocr_text)
        return medicines, method
