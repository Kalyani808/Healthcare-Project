import io
import logging
import concurrent.futures
from gtts import gTTS

logger = logging.getLogger(__name__)

# In-memory LRU-style cache for generated audio bytes: (text, lang) -> audio_bytes
_AUDIO_CACHE = {}

def _split_text_into_smart_chunks(text, max_chunk_len=180):
    """
    Splits text along sentence boundaries (., |, ।, \n) into optimal TTS chunks
    under max_chunk_len characters to ensure high speed and prevent character limits.
    """
    if not text:
        return []

    # Clean text
    clean_text = text.replace('\r', ' ').replace('\n', ' ').strip()
    
    # Split by standard sentence delimiters
    raw_parts = []
    current_word = []
    for ch in clean_text:
        if ch in ('.', '।', '!', '?'):
            if current_word:
                raw_parts.append("".join(current_word).strip() + ch)
                current_word = []
        else:
            current_word.append(ch)
    if current_word:
        raw_parts.append("".join(current_word).strip())

    # Group small parts together into coherent chunks under max_chunk_len
    chunks = []
    cur_chunk = []
    cur_len = 0

    for part in raw_parts:
        if not part.strip():
            continue
        p_len = len(part)
        if cur_len + p_len < max_chunk_len:
            cur_chunk.append(part)
            cur_len += p_len + 1
        else:
            if cur_chunk:
                chunks.append(" ".join(cur_chunk).strip())
            cur_chunk = [part]
            cur_len = p_len

    if cur_chunk:
        chunks.append(" ".join(cur_chunk).strip())

    return chunks or [clean_text]

def _synthesize_single_chunk(chunk_text, target_lang):
    """
    Synthesizes a single chunk of text into MP3 bytes using Google TTS.
    """
    if not chunk_text.strip():
        return b""
    try:
        tts = gTTS(text=chunk_text, lang=target_lang, slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        return fp.getvalue()
    except Exception as e:
        logger.error(f"[TTS CHUNK ERROR] Failed for chunk '{chunk_text[:30]}...' lang='{target_lang}': {str(e)}")
        return b""

def generate_audio_for_text(text, lang='en'):
    """
    Generate seamless MP3 audio bytes for arbitrary prescription text in the specified language
    (en, hi, mr, te, ta, bn) using parallel chunked synthesis and in-memory caching.
    """
    if not text or not text.strip():
        return b""

    cleaned_text = text.strip()
    cache_key = (cleaned_text, lang.lower()[:2])
    if cache_key in _AUDIO_CACHE:
        return _AUDIO_CACHE[cache_key]

    try:
        supported_langs = {'en': 'en', 'hi': 'hi', 'mr': 'mr', 'ta': 'ta', 'te': 'te', 'bn': 'bn'}
        target_lang = supported_langs.get(lang.lower()[:2], 'en')

        chunks = _split_text_into_smart_chunks(cleaned_text, max_chunk_len=180)

        if len(chunks) == 1:
            audio_bytes = _synthesize_single_chunk(chunks[0], target_lang)
        else:
            max_workers = min(len(chunks), 4)
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = [executor.submit(_synthesize_single_chunk, chunk, target_lang) for chunk in chunks]
                results = [f.result() for f in futures]
            audio_bytes = b"".join(results)

        if audio_bytes:
            # Keep cache from growing unboundedly (limit to 100 entries)
            if len(_AUDIO_CACHE) > 100:
                _AUDIO_CACHE.clear()
            _AUDIO_CACHE[cache_key] = audio_bytes

        return audio_bytes
    except Exception as e:
        logger.error(f"[AUDIO GENERATOR ERROR] Failed to generate audio for lang='{lang}': {str(e)}")
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
    return generate_audio_for_text(full_summary, lang=lang)
