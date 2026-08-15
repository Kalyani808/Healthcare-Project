import os
import urllib.request
import json
import logging
import ollama

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_OCR_MODEL = os.getenv("OLLAMA_OCR_MODEL", "glm-ocr")
FALLBACK_VISION_MODEL = "qwen3-vl:4b-instruct"

class GLMOCRService:
    def __init__(self, base_url=OLLAMA_BASE_URL, default_model=OLLAMA_OCR_MODEL):
        self.base_url = base_url.rstrip('/')
        self.default_model = default_model

    def check_ollama_availability(self):
        """
        Check if local Ollama service is reachable and return list of available model names.
        """
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
            logger.warning(f"[OLLAMA CHECK] Ollama unreachable at {self.base_url}: {str(e)}")
        return False, []

    def get_preferred_ocr_model(self, available_models):
        """Select preferred local vision/OCR model."""
        if any(self.default_model in m for m in available_models):
            return "glm-ocr:latest" if "glm-ocr:latest" in available_models else "glm-ocr"
        if any("glm" in m.lower() and "ocr" in m.lower() for m in available_models):
            return [m for m in available_models if "glm" in m.lower() and "ocr" in m.lower()][0]
        if any(FALLBACK_VISION_MODEL in m for m in available_models):
            return FALLBACK_VISION_MODEL
        if any("vl" in m.lower() or "vision" in m.lower() for m in available_models):
            return [m for m in available_models if "vl" in m.lower() or "vision" in m.lower()][0]
        return None

    def extract_text_from_image(self, image_path):
        """
        Primary OCR Extraction: Sends image to local GLM-OCR model via Ollama.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Prescription image file not found: {image_path}")

        is_running, available_models = self.check_ollama_availability()
        ocr_model = self.get_preferred_ocr_model(available_models) if is_running else None

        if is_running and ocr_model:
            print(f"[GLM-OCR] Sending image to local Ollama model: {ocr_model} (25s timeout)")
            try:
                prompt = (
                    "Extract all written and printed prescription text from this medical document image accurately. "
                    "Include all medicine names, strengths, dosages (e.g. 1-0-1, 1-0-0), durations, and administration timings. "
                    "Output exact OCR text lines without adding explanations or medical commentary."
                )

                client = ollama.Client(host=self.base_url, timeout=25.0)
                response = client.chat(
                    model=ocr_model,
                    messages=[{
                        'role': 'user',
                        'content': prompt,
                        'images': [image_path]
                    }],
                    options={'temperature': 0.0}
                )

                extracted_text = response.get('message', {}).get('content', '').strip()
                if extracted_text:
                    print(f"[GLM-OCR SUCCESS] Extracted {len(extracted_text)} chars from image using {ocr_model}")
                    return {
                        "status": "success",
                        "text": extracted_text,
                        "method": f"ollama_{ocr_model.replace(':', '_')}",
                        "model_used": ocr_model,
                        "offline": True
                    }
            except Exception as e:
                fallback_reason = f"Ollama GLM-OCR execution error/timeout ({type(e).__name__}: {str(e)})"
                print(f"[GLM-OCR FALLBACK TRIGGER] {fallback_reason}. Utilizing EasyOCR multi-pass fallback...")
        else:
            fallback_reason = f"Ollama service unreachable at {self.base_url} or model '{self.default_model}' unavailable."

        # Fallback to EasyOCR pipeline if Ollama/GLM-OCR is unavailable
        print(f"[GLM-OCR FALLBACK] {fallback_reason} Utilizing EasyOCR multi-pass fallback...")
        try:
            from ..icr_extractor import PrescriptionICR
            icr = PrescriptionICR()
            res = icr.extract_text(image_path)
            return {
                "status": "success",
                "text": res.get("extracted_text", ""),
                "method": "easyocr_multipass_fallback",
                "model_used": "easyocr_craft_resnet",
                "ocr_used_fallback": True,
                "ocr_fallback_reason": fallback_reason,
                "offline": True
            }
        except Exception as fallback_err:
            raise RuntimeError(f"OCR extraction failed on both GLM-OCR and fallback engine: {str(fallback_err)}")
