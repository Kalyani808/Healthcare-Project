import os
import sys
import io

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_platform.settings')
django.setup()

from gtts import gTTS
from documents.services.voice_transcription_service import VoiceTranscriptionService

class DummyFile:
    def __init__(self, audio_bytes, name="sample.mp3"):
        self.bytes = audio_bytes
        self.name = name
    def chunks(self):
        yield self.bytes

print("==================================================================")
print("  TESTING LOCAL FASTER-WHISPER OFFLINE TRANSCRIPTION & AUTO-LANG ")
print("==================================================================")

phrases = [
    ("hi", "буखार के लिए क्या लेना चाहिए", "Bukhar ke liye kya lena chahiye"),
    ("en", "What medicine should I take for fever and headache?", "What medicine should I take for fever and headache?"),
    ("te", "జ్వరం మరియు తలనొప్పికి ఏమి తీసుకోవాలి", "Jwaram mariyu thalanoppiki emi theeskovali"),
]

for target_lang, text, safe_label in phrases:
    print(f"\n[SYNTHESIZING SAMPLE AUDIO] Lang: {target_lang} | Label: {safe_label}")
    tts = gTTS(text=text, lang=target_lang, slow=False)
    fp = io.BytesIO()
    tts.write_to_fp(fp)
    audio_data = fp.getvalue()

    dummy_file = DummyFile(audio_data, name=f"sample_{target_lang}.mp3")

    result = VoiceTranscriptionService.transcribe_audio_file(dummy_file)
    safe_text = result['text'].encode('ascii', errors='ignore').decode('ascii') or result['text']
    print(f"  -> Result Status: {result['status']}")
    print(f"  -> Detected Language: '{result['language']}' (Confidence: {result['language_probability']})")
    print(f"  -> Transcribed Text Repr: {repr(result['text'])}")
    print(f"  -> Duration / CPU Time: {result['duration']}s")
