import os
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
        print(f"[ICR] Image dimensions: {w}x{h}")

        # Step 3: Preprocess image
        original_img, enhanced_img, _ = preprocess_image(img)
        handwritten_img = preprocess_handwritten_image(img)
        print(f"[ICR] Preprocessing completed")

        # Step 4: Multi-pass EasyOCR reading
        results_enhanced = self.reader.readtext(enhanced_img)
        results_original = self.reader.readtext(original_img)
        results_handwritten = self.reader.readtext(handwritten_img) if handwritten_img is not None else []

        # Merge results prioritizing longest line recall & highest overall confidence
        all_passes = [results_enhanced, results_original, results_handwritten]
        best_pass = max(all_passes, key=lambda pass_res: (len(pass_res), sum(item[2] for item in pass_res)))

        lines_output = []
        full_text_parts = []
        confidences = []

        # Step 5: Process extracted OCR lines
        for bbox, text, prob in best_pass:
            clean_text = text.strip()
            if not clean_text:
                continue

            bbox_list = [[int(pt[0]), int(pt[1])] for pt in bbox]
            conf = float(prob)

            lines_output.append({
                "text": clean_text,
                "confidence": round(conf, 4),
                "bbox": bbox_list
            })
            full_text_parts.append(clean_text)
            confidences.append(conf)

        # CRITICAL: Preserve line breaks '\n' so multi-medicine lines remain separate!
        extracted_text = "\n".join(full_text_parts)
        processing_time = round(time.time() - start_time, 2)
        overall_confidence = round(float(np.mean(confidences)), 4) if confidences else 0.0
        handwritten_detected = is_handwritten(lines_output)
        requires_manual_review = overall_confidence < 0.80

        print(f"[ICR] OCR completed in {processing_time}s")
        print(f"[ICR] Extracted text length: {len(extracted_text)} chars ({len(lines_output)} lines)")
        print(f"[ICR RAW TEXT]:\n{extracted_text}\n--- END ICR RAW TEXT ---")

        return {
            "document_id": document_id,
            "text": extracted_text.strip(),
            "extracted_text": extracted_text.strip(),
            "confidence": overall_confidence,
            "confidence_score": overall_confidence,
            "num_lines": len(lines_output),
            "lines": lines_output,
            "is_handwritten_detected": handwritten_detected,
            "requires_manual_review": requires_manual_review,
            "processing_time_seconds": processing_time,
            "status": "success"
        }


def extract_text_from_prescription(image_path, document_id=None):
    """Convenience function wrapper around PrescriptionICR."""
    icr = PrescriptionICR()
    return icr.extract_text(image_path, document_id=document_id)
