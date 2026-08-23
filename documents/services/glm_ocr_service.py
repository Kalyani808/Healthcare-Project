import os
import logging
from ..icr_extractor import PrescriptionICR

logger = logging.getLogger(__name__)

class GLMOCRService:
    def __init__(self, base_url=None, default_model=None):
        self.icr = PrescriptionICR()

    def extract_text_from_image(self, image_path):
        """
        Streamlined, ultra-fast OCR Extraction:
        Uses PrescriptionICR (Vision LLM when available, fast optimized EasyOCR fallback).
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Prescription image file not found: {image_path}")

        print(f"[OCR SERVICE] Starting fast OCR extraction on: {image_path}")
        res = self.icr.extract_text(image_path)
        
        extracted_text = res.get("extracted_text") or res.get("text") or ""
        method = res.get("method") or ("openrouter_vision_llm" if not res.get("ocr_used_fallback") else "easyocr_fast")
        
        return {
            "status": "success",
            "text": extracted_text,
            "method": method,
            "model_used": res.get("model_used", "icr_hybrid"),
            "confidence": res.get("confidence", 0.90),
            "offline": res.get("offline", True)
        }
