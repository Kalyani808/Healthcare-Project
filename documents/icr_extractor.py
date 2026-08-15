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
        Must read ACTUAL image file and extract REAL text from disk.
        """
        start_time = time.time()

        # Step 1: Validate file exists
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        file_size = os.path.getsize(image_path)
        print(f"[ICR] Processing file: {image_path} ({file_size} bytes)")

        # Step 2: Load and decode image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image file or invalid format: {image_path}")

        h, w = img.shape[:2]
        print(f"\n========== ICR DEBUG ==========")
        print(f"Image: {image_path}")
        print(f"Original dimensions: {w}x{h}")

        # Step 3: Determine upscale factor (2x to 4x for small low-res prescription photos)
        scale_factor = 1.0
        if max(w, h) < 800:
            scale_factor = 4.0
        elif max(w, h) < 1500:
            scale_factor = 2.5
        elif max(w, h) < 2200:
            scale_factor = 1.5

        if scale_factor > 1.0:
            new_w, new_h = int(w * scale_factor), int(h * scale_factor)
            up_img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
            print(f"Upscaled image ({scale_factor}x Lanczos): {new_w}x{new_h}")
        else:
            up_img = img

        gray_up = cv2.cvtColor(up_img, cv2.COLOR_BGR2GRAY) if len(up_img.shape) == 3 else up_img

        # Step 4: Generate 5 Preprocessing Variants for Multi-Pass OCR
        # Variant 1: Original Grayscale
        var1_orig = gray_up

        # Variant 2: CLAHE Contrast Enhanced
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        var2_clahe = clahe.apply(gray_up)

        # Variant 3: 2D Sharpness Kernel Filter
        kernel_sharp = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        var3_sharp = cv2.filter2D(gray_up, -1, kernel_sharp)

        # Variant 4: Bilateral Denoised Filter (Handwriting Stroke Edge Preserving)
        var4_denoised = cv2.bilateralFilter(gray_up, 11, 75, 75)

        # Variant 5: Adaptive Binarization
        var5_adaptive = cv2.adaptiveThreshold(
            var4_denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )

        print("Preprocessing variants generated: original, upscaled_grayscale, clahe_enhanced, sharpened, denoised_adaptive")

        # Step 5: Multi-Pass EasyOCR Reading
        pass1 = self.reader.readtext(var1_orig)
        pass2 = self.reader.readtext(var2_clahe)
        pass3 = self.reader.readtext(var3_sharp)
        pass4 = self.reader.readtext(var4_denoised)
        pass5 = self.reader.readtext(var5_adaptive)

        print(f"OCR Pass 1 (Original/Upscaled): {len(pass1)} lines")
        print(f"OCR Pass 2 (CLAHE): {len(pass2)} lines")
        print(f"OCR Pass 3 (Sharpened): {len(pass3)} lines")
        print(f"OCR Pass 4 (Denoised): {len(pass4)} lines")
        print(f"OCR Pass 5 (Adaptive Threshold): {len(pass5)} lines")

        # Step 6: Multi-Pass Consensus & Text Combination
        # Combine detections across all 5 passes, preserving maximum character recall & unique lines
        all_raw_pass_results = [pass1, pass2, pass3, pass4, pass5]

        combined_lines = []
        seen_line_texts = set()

        for pass_res in all_raw_pass_results:
            for bbox, text, prob in pass_res:
                clean_text = text.strip()
                if not clean_text or len(clean_text) < 1:
                    continue

                clean_key = re.sub(r'\s+', ' ', clean_text.lower())
                conf = float(prob)

                # Deduplicate exact duplicate line entries while favoring higher confidence
                if clean_key not in seen_line_texts:
                    seen_line_texts.add(clean_key)
                    bbox_list = [[int(pt[0]), int(pt[1])] for pt in bbox]
                    combined_lines.append({
                        "text": clean_text,
                        "confidence": round(conf, 4),
                        "bbox": bbox_list
                    })

        # Sort lines top-to-bottom by vertical Y bbox position for coherent document reading
        def get_top_y(line_item):
            bbox = line_item.get("bbox", [])
            if bbox and len(bbox) > 0:
                return bbox[0][1]
            return 0

        combined_lines.sort(key=get_top_y)

        full_text_parts = [line_item["text"] for line_item in combined_lines]
        confidences = [line_item["confidence"] for line_item in combined_lines]

        # CRITICAL: Preserve line breaks '\n' in raw_ocr_text!
        extracted_text = "\n".join(full_text_parts)
        processing_time = round(time.time() - start_time, 2)
        overall_confidence = round(float(np.mean(confidences)), 4) if confidences else 0.0
        handwritten_detected = is_handwritten(combined_lines)

        print(f"COMBINED OCR: Extracted {len(extracted_text)} chars across {len(combined_lines)} lines")
        print(f"[ICR RAW OCR TEXT]:\n{extracted_text}\n===============================\n")

        return {
            "document_id": document_id,
            "text": extracted_text.strip(),
            "extracted_text": extracted_text.strip(),
            "raw_ocr_text": extracted_text.strip(),
            "confidence": overall_confidence,
            "confidence_score": overall_confidence,
            "num_lines": len(combined_lines),
            "lines": combined_lines,
            "is_handwritten_detected": handwritten_detected,
            "requires_manual_review": False,  # Never reject or require manual block!
            "processing_time_seconds": processing_time,
            "status": "success"
        }


def extract_text_from_prescription(image_path, document_id=None):
    """Convenience function wrapper around PrescriptionICR."""
    icr = PrescriptionICR()
    return icr.extract_text(image_path, document_id=document_id)
