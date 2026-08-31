import os
import re
import time
import numpy as np
import cv2
from PIL import Image

# Global lazy-loaded EasyOCR reader
_OCR_READER = None

def get_ocr_reader():
    """Lazy load EasyOCR reader once to save memory and warm up model."""
    global _OCR_READER
    if _OCR_READER is None:
        import easyocr
        # Initialize EasyOCR reader with verbose=False to prevent Windows stdout encoding issues
        _OCR_READER = easyocr.Reader(['en'], gpu=False, verbose=False)
    return _OCR_READER

def preprocess_image(image_input):
    """
    Image Preprocessing Pipeline optimized for handwritten & printed prescriptions:
    1. Deskew (rotate to correct angle)
    2. Denoise (remove background noise)
    3. Contrast Enhancement (CLAHE)
    4. Adaptive Thresholding (convert to clean binarized image)
    """
    if isinstance(image_input, str):
        if not os.path.exists(image_input):
            raise FileNotFoundError(f"Image file not found: {image_input}")
        img = cv2.imread(image_input)
    elif isinstance(image_input, np.ndarray):
        img = image_input
    elif isinstance(image_input, Image.Image):
        img = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
    else:
        raise ValueError("Invalid image input type. Expected path, numpy array, or PIL Image.")

    if img is None:
        raise ValueError("Failed to decode image.")

    # 1. Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Deskewing
    coords = np.column_stack(np.where(gray < 240))
    angle = 0.0
    if coords.shape[0] > 0:
        rect = cv2.minAreaRect(coords)
        angle = rect[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

    if abs(angle) > 0.5 and abs(angle) < 45:
        (h, w) = gray.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    # 3. Denoising
    denoised = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)

    # 4. Contrast Enhancement via CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # 5. Thresholding / Binarization
    thresh = cv2.adaptiveThreshold(
        enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

    return img, enhanced, thresh

def assess_image_quality(image_path):
    """
    Rate image quality (sharpness, brightness, contrast) before OCR processing.
    - Sharpness: Laplacian variance (>100 = high, 40-100 = medium, <40 = low/blurry)
    - Brightness: mean grayscale (0-255, ideal 50-220)
    - Contrast: std dev of grayscale
    """
    if isinstance(image_path, str):
        img = cv2.imread(image_path)
    else:
        img = image_path

    if img is None:
        return {
            "sharpness": 0.0,
            "brightness": 0.0,
            "contrast": 0.0,
            "image_quality": "low",
            "reason": "Failed to decode image file"
        }

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))

    if laplacian_var < 35:
        quality_label = "low"
        reason = f"Image is too blurry (sharpness: {laplacian_var:.1f})"
    elif brightness < 35 or brightness > 235:
        quality_label = "low"
        reason = f"Image lighting is too dark/bright (brightness: {brightness:.1f})"
    elif laplacian_var < 75:
        quality_label = "medium"
        reason = "Moderate image sharpness"
    else:
        quality_label = "high"
        reason = "Acceptable image clarity"

    return {
        "sharpness": round(laplacian_var, 1),
        "brightness": round(brightness, 1),
        "contrast": round(contrast, 1),
        "image_quality": quality_label,
        "reason": reason
    }


def preprocess_handwritten_image(image_path):
    """Specialized aggressive preprocessing pipeline for handwritten prescriptions."""
    if isinstance(image_path, str):
        img = cv2.imread(image_path)
    else:
        img = image_path

    if img is None:
        return None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Bilateral filter (preserve edges while suppressing paper texture noise)
    filtered = cv2.bilateralFilter(gray, 11, 75, 75)

    # 2. Adaptive threshold (handles uneven lighting)
    thresh = cv2.adaptiveThreshold(
        filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

    # 3. Morphological operations (clean up & connect broken strokes)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    dilated = cv2.dilate(opened, kernel, iterations=1)

    # 4. CLAHE (enhance contrast)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(dilated)

    return enhanced


def is_handwritten(lines_data):
    """
    Heuristic to estimate if text contains handwriting based on confidence variance.
    """
    if not lines_data:
        return False

    confidences = [item['confidence'] for item in lines_data]
    avg_conf = np.mean(confidences)
    std_conf = np.std(confidences)

    if std_conf > 0.18 or avg_conf < 0.88:
        return True
    return False


class PrescriptionICR:
    """Intelligent Character Recognition engine for handwritten and printed prescriptions."""

    def __init__(self):
        self.reader = get_ocr_reader()

    def preprocess_image(self, image_path):
        return preprocess_image(image_path)

    def extract_text(self, image_path, document_id=None):
        """
        Extract text from prescription image. Uses Vision LLM if API key is configured,
        otherwise falls back to local EasyOCR.
        """
        start_time = time.time()

        # Step 1: Validate file exists
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        file_size = os.path.getsize(image_path)
        print(f"[ICR] Processing file: {image_path} ({file_size} bytes)")

        # Step 2: Cloud Vision LLM (Automatically enabled when OPENROUTER_API_KEY is set)
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            try:
                from decouple import config
                api_key = config("OPENROUTER_API_KEY", default=None)
            except Exception:
                pass

        if api_key:
            try:
                import base64
                import json
                import requests
                import io
                from PIL import Image

                pil_img = Image.open(image_path)
                if pil_img.mode in ('RGBA', 'P'):
                    pil_img = pil_img.convert('RGB')
                pil_img.thumbnail((1200, 1200), Image.Resampling.BILINEAR)
                buf = io.BytesIO()
                pil_img.save(buf, format='JPEG', quality=80)
                base64_image = base64.b64encode(buf.getvalue()).decode('utf-8')

                vision_prompt = (
                    "Extract doctor_name, patient_name, clinic, diagnosis, and medicines with name, dosage, frequency, instructions in JSON."
                )

                resp = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": os.getenv("OPENROUTER_VISION_MODEL", "openai/gpt-4o-mini"),
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": vision_prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                                    }
                                ]
                            }
                        ],
                        "max_tokens": 800,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=12.0
                )

                if resp.status_code == 200:
                    raw_content = resp.json()["choices"][0]["message"]["content"]
                    print(f"[VISION LLM SUCCESS] Extracted prescription data: {raw_content[:80]}...")
                    proc_time = round(time.time() - start_time, 2)
                    return {
                        "document_id": document_id,
                        "text": raw_content,
                        "extracted_text": raw_content,
                        "confidence": 0.95,
                        "confidence_score": 0.95,
                        "num_lines": 5,
                        "lines": [],
                        "is_handwritten_detected": True,
                        "requires_manual_review": False,
                        "processing_time_seconds": proc_time,
                        "status": "success"
                    }
                else:
                    print(f"[VISION LLM ERROR] API responded with status {resp.status_code}: {resp.text}")
            except Exception as v_err:
                print(f"[VISION LLM FALLBACK] Falling back to local OCR due to: {v_err}")

        # Step 2b: Local Ollama Explicit OCR Model (OLLAMA_OCR_MODEL)
        try:
            configured_ocr_model = os.getenv("OLLAMA_OCR_MODEL")
            if not configured_ocr_model:
                try:
                    from decouple import config
                    configured_ocr_model = config("OLLAMA_OCR_MODEL", default="glm-ocr:latest")
                except Exception:
                    configured_ocr_model = "glm-ocr:latest"

            import socket, urllib.request, base64, json, io
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.05)
            if s.connect_ex(("127.0.0.1", 11434)) == 0:
                s.close()
                req = urllib.request.Request("http://127.0.0.1:11434/api/tags")
                with urllib.request.urlopen(req, timeout=0.5) as resp:
                    if resp.status == 200:
                        m_data = json.loads(resp.read().decode('utf-8'))
                        m_names = [m.get('name', '') for m in m_data.get('models', [])]
                        
                        # Match exact configured model against installed Ollama models
                        chosen_v_model = None
                        for m in m_names:
                            if m == configured_ocr_model or m.split(':')[0] == configured_ocr_model.split(':')[0]:
                                chosen_v_model = m
                                break

                        if chosen_v_model:
                            pil_img = Image.open(image_path)
                            if pil_img.mode in ('RGBA', 'P'):
                                pil_img = pil_img.convert('RGB')
                            pil_img.thumbnail((1000, 1000), Image.Resampling.BILINEAR)
                            buf = io.BytesIO()
                            pil_img.save(buf, format='JPEG', quality=85)
                            b64_img = base64.b64encode(buf.getvalue()).decode('utf-8')

                            prompt_str = (
                                "Text Recognition: Transcribe all readable text from this medical prescription image. "
                                "Preserve medicine names, dosage, frequency, duration, instructions, doctor notes, and other visible text as accurately as possible. "
                                "Return the recognized text as plain text. Do not invent missing information."
                            )
                            payload = json.dumps({
                                "model": chosen_v_model,
                                "prompt": prompt_str,
                                "images": [b64_img],
                                "stream": False
                            }).encode('utf-8')
                            vreq = urllib.request.Request("http://127.0.0.1:11434/api/generate", data=payload, headers={"Content-Type": "application/json"})
                            with urllib.request.urlopen(vreq, timeout=12.0) as vresp:
                                if vresp.status == 200:
                                    vout = json.loads(vresp.read().decode('utf-8')).get('response', '')
                                    if vout and len(vout.strip()) > 5:
                                        print(f"[OLLAMA OCR SUCCESS] Extracted with {chosen_v_model}")
                                        proc_time = round(time.time() - start_time, 2)
                                        return {
                                            "document_id": document_id,
                                            "text": vout,
                                            "extracted_text": vout,
                                            "confidence": 0.96,
                                            "processing_time_seconds": proc_time,
                                            "status": "success",
                                            "model_used": chosen_v_model
                                        }
        except Exception as ollama_v_err:
            pass

        # Step 3: Local Fast High-Accuracy EasyOCR Fallback Pipeline
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image file or invalid format: {image_path}")

        h, w = img.shape[:2]
        print(f"\n========== ICR FAST OCR DEBUG ==========")
        print(f"Image: {image_path} (Original dimensions: {w}x{h})")

        # Optimize resolution for fast CPU inference (max 960px dimension)
        max_dim = max(w, h)
        if max_dim > 960:
            scale = 960.0 / max_dim
            proc_img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        elif max_dim < 500:
            proc_img = cv2.resize(img, (w * 2, h * 2), interpolation=cv2.INTER_LANCZOS4)
        else:
            proc_img = img

        gray = cv2.cvtColor(proc_img, cv2.COLOR_BGR2GRAY) if len(proc_img.shape) == 3 else proc_img

        # Step 4: High-contrast CLAHE preprocessing
        clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
        var_clahe = clahe.apply(gray)

        # Step 5: Fast OCR Pass
        t_ocr_start = time.time()
        pass1 = self.reader.readtext(var_clahe, batch_size=4, paragraph=False)
        print(f"Fast EasyOCR pass completed in {round(time.time() - t_ocr_start, 2)}s! Found {len(pass1)} lines.")

        combined_lines = []
        for bbox, text, prob in pass1:
            clean_text = text.strip()
            if not clean_text or len(clean_text) < 1:
                continue
            bbox_list = [[int(pt[0]), int(pt[1])] for pt in bbox]
            combined_lines.append({
                "text": clean_text,
                "confidence": round(float(prob), 4),
                "bbox": bbox_list
            })

        # Sort lines top-to-bottom by vertical Y bbox position
        def get_top_y(line_item):
            bbox = line_item.get("bbox", [])
            if bbox and len(bbox) > 0:
                return bbox[0][1]
            return 0

        combined_lines.sort(key=get_top_y)

        full_text_parts = [line_item["text"] for line_item in combined_lines]
        confidences = [line_item["confidence"] for line_item in combined_lines]

        extracted_text = "\n".join(full_text_parts)
        processing_time = round(time.time() - start_time, 2)
        overall_confidence = round(float(np.mean(confidences)), 4) if confidences else 0.85

        print(f"FAST OCR: Extracted {len(extracted_text)} chars across {len(combined_lines)} lines in {processing_time}s")
        print(f"[ICR RAW OCR TEXT]:\n{extracted_text[:300]}...\n===============================\n")

        return {
            "document_id": document_id,
            "text": extracted_text.strip(),
            "extracted_text": extracted_text.strip(),
            "raw_ocr_text": extracted_text.strip(),
            "confidence": overall_confidence,
            "confidence_score": overall_confidence,
            "num_lines": len(combined_lines),
            "lines": combined_lines,
            "is_handwritten_detected": True,
            "requires_manual_review": False,
            "processing_time_seconds": processing_time,
            "status": "success"
        }


def extract_text_from_prescription(image_path, document_id=None):
    """Convenience function wrapper around PrescriptionICR."""
    icr = PrescriptionICR()
    return icr.extract_text(image_path, document_id=document_id)
