import io
import logging
import concurrent.futures
from gtts import gTTS

logger = logging.getLogger(__name__)

# Cache for generated audio bytes: (text, lang) -> audio_bytes
_AUDIO_CACHE = {}

def generate_audio_for_text(text, lang='en'):
    """
    Generate audio bytes for a text string in the specified language (en, hi, mr, ta, te, bn).
    Uses caching for fast duplicate audio playback.
    """
    if not text:
        return b""

    cache_key = (text.strip(), lang)
    if cache_key in _AUDIO_CACHE:
        return _AUDIO_CACHE[cache_key]

    try:
        supported_langs = {'en': 'en', 'hi': 'hi', 'mr': 'mr', 'ta': 'ta', 'te': 'te', 'bn': 'bn'}
        target_lang = supported_langs.get(lang.lower()[:2], 'en')

        tts = gTTS(text=text, lang=target_lang, slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        audio_bytes = fp.getvalue()

        _AUDIO_CACHE[cache_key] = audio_bytes
        return audio_bytes
    except Exception as e:
        logger.error(f"[AUDIO GENERATOR ERROR] Failed to generate gTTS audio for lang='{lang}': {str(e)}")
        return b""

def generate_audio_for_medicines(medicines_list, lang='en'):
    """
    Generates audio bytes summarizing all extracted medicines using multi-threading for fast response.
    """
    if not medicines_list:
        no_med_text = "No medicines could be identified from this prescription."
        return generate_audio_for_text(no_med_text, lang=lang)

    summary_parts = [f"Prescription summary containing {len(medicines_list)} medications."]
    for i, med in enumerate(medicines_list, start=1):
        name = med.get('name') or med.get('medicine') or 'Medication'
        strength = med.get('strength') or ''
        freq = med.get('frequency') or ''
        timing = med.get('timing') or ''
        dur = med.get('duration') or ''

        part = f"Number {i}: {name} {strength}."
        if freq:
            part += f" Take {freq}."
        if timing:
            part += f" {timing}."
        if dur:
            part += f" For {dur}."
        summary_parts.append(part)

    full_summary = " ".join(summary_parts)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future = executor.submit(generate_audio_for_text, full_summary, lang)
        return future.result()
