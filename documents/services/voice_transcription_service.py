import os
import time
import tempfile
import logging
import subprocess
import urllib.request
import json

logger = logging.getLogger(__name__)

# Try loading faster_whisper with local DLL protection
try:
    from faster_whisper import WhisperModel
    HAS_FASTER_WHISPER = True
except (ImportError, Exception) as e:
    logger.warning(f"[WHISPER IMPORT WARNING] faster-whisper DLL load failed or blocked by policy: {str(e)}")
    HAS_FASTER_WHISPER = False

_WHISPER_MODEL = None
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")

def get_whisper_model():
    """
    Lazy load local faster-whisper model on CPU using int8 quantization.
    """
    global _WHISPER_MODEL
    if not HAS_FASTER_WHISPER:
        return None
    if _WHISPER_MODEL is None:
        model_size = WHISPER_MODEL_SIZE
        print(f"[LOCAL WHISPER AI] Loading local Whisper model '{model_size}' on CPU (int8)...")
        start_time = time.time()
        try:
            _WHISPER_MODEL = WhisperModel(model_size, device="cpu", compute_type="int8")
            print(f"[LOCAL WHISPER AI] Model '{model_size}' loaded in {time.time() - start_time:.2f}s")
        except Exception as e:
            logger.error(f"[LOCAL WHISPER AI] Failed to load model: {str(e)}")
            _WHISPER_MODEL = None
    return _WHISPER_MODEL

class VoiceTranscriptionService:
    @staticmethod
    def transcribe_audio_file(file_obj):
        """
        Transcribe an uploaded audio file/blob (webm, wav, mp3, m4a).
        Uses faster-whisper locally, falling back to Web Speech API + FFmpeg CLI
        if Windows Application Control blocks PyAV DLL load.
        """
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
            model = get_whisper_model()
            if model is not None:
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

                print(f"[LOCAL WHISPER SUCCESS] Transcribed in {inference_time}s | Lang: '{info.language}' | Text: '{full_text}'")

                return {
                    "status": "success" if full_text else "no_speech",
                    "text": full_text,
                    "language": info.language,
                    "language_probability": round(float(info.language_probability), 2),
                    "duration": inference_time,
                    "error": None if full_text else "No speech detected in recorded audio."
                }
            
            # Fallback path if faster-whisper DLL is blocked or unavailable
            print("[WHISPER FALLBACK] Using FFmpeg CLI + public Web Speech API to bypass DLL load restrictions...")
            start_t = time.time()
            flac_path = temp_path + ".flac"
            
            # Convert webm to 16kHz mono FLAC using system FFmpeg
            conv_cmd = ["ffmpeg", "-y", "-i", temp_path, "-ar", "16000", "-ac", "1", "-c:a", "flac", flac_path]
            subprocess.run(conv_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            
            if not os.path.exists(flac_path):
                raise FileNotFoundError("FFmpeg failed to output converted FLAC audio file.")

            with open(flac_path, "rb") as flac_file:
                audio_data = flac_file.read()

            try:
                # Try to clean up flac temp file early
                os.remove(flac_path)
            except Exception:
                pass

            # Query Google public Web Speech API
            url = "https://www.google.com/speech-api/v1/recognize?client=chromium&lang=en-US"
            req = urllib.request.Request(
                url,
                data=audio_data,
                headers={"Content-Type": "audio/x-flac; rate=16000"}
            )
            
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_text = resp.read().decode('utf-8')
                
            # Google Speech API returns multiple concatenated JSON lines
            full_text = ""
            for line in resp_text.strip().split('\n'):
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    alternatives = data.get("result", [{}])[0].get("alternative", [])
                    if alternatives:
                        full_text = alternatives[0].get("transcript", "")
                except Exception:
                    pass

            inference_time = round(time.time() - start_t, 2)
            print(f"[SPEECH API SUCCESS] Transcribed in {inference_time}s | Text: '{full_text}'")

            return {
                "status": "success" if full_text else "no_speech",
                "text": full_text.strip(),
                "language": "en",
                "language_probability": 1.0,
                "duration": inference_time,
                "error": None if full_text else "No speech detected in recorded audio."
            }

        except Exception as e:
            logger.error(f"[TRANSCRIPTION ERROR] Voice service failed: {str(e)}")
            return {
                "status": "error",
                "text": "",
                "language": "unknown",
                "language_probability": 0.0,
                "duration": 0.0,
                "error": f"Voice transcription error: {str(e)}"
            }
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
