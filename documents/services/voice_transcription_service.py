import os
import time
import tempfile
import logging
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

_WHISPER_MODEL = None
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")

def get_whisper_model():
    """
    Lazy load local faster-whisper model on CPU using int8 quantization.
    Model sizes: 'base' (~140MB, 1.5s-3s inference), 'small' (~460MB, 4s-7s inference).
    """
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        model_size = WHISPER_MODEL_SIZE
        print(f"[LOCAL WHISPER AI] Loading local Whisper model '{model_size}' on CPU (int8)...")
        start_time = time.time()
        _WHISPER_MODEL = WhisperModel(model_size, device="cpu", compute_type="int8")
        print(f"[LOCAL WHISPER AI] Model '{model_size}' loaded in {time.time() - start_time:.2f}s")
    return _WHISPER_MODEL

class VoiceTranscriptionService:
    @staticmethod
    def transcribe_audio_file(file_obj):
        """
        Transcribe an uploaded audio file/blob (webm, wav, mp3, m4a) using local faster-whisper.
        """
        model = get_whisper_model()
        
        suffix = ".webm"
        if hasattr(file_obj, 'name') and file_obj.name:
            _, ext = os.path.splitext(file_obj.name)
            if ext:
                suffix = ext

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            for chunk in file_obj.chunks():
                temp_file.write(chunk)
            temp_path = temp_file.name

        try:
            start_t = time.time()
            segments, info = model.transcribe(
                temp_path,
                beam_size=5,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500)
            )

            text_parts = [segment.text.strip() for segment in segments]
            full_text = " ".join(text_parts).strip()
            inference_time = round(time.time() - start_t, 2)

            print(f"[LOCAL WHISPER SUCCESS] Transcribed in {inference_time}s | Lang: '{info.language}' (prob: {info.language_probability:.2f}) | Text: '{full_text}'")

            return {
                "status": "success" if full_text else "no_speech",
                "text": full_text,
                "language": info.language,
                "language_probability": round(float(info.language_probability), 2),
                "duration": inference_time,
                "error": None if full_text else "No speech detected in recorded audio."
            }
        except Exception as e:
            logger.error(f"[LOCAL WHISPER ERROR] Transcription failed: {str(e)}")
            return {
                "status": "error",
                "text": "",
                "language": "unknown",
                "language_probability": 0.0,
                "duration": 0.0,
                "error": f"Local Whisper transcription error: {str(e)}"
            }
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
