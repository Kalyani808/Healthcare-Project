import re

class AudioService:
    @staticmethod
    def humanize_dosage_speech(freq_str, dosage_str, lang='en'):
        """
        Translates raw dosage codes like '1-0-1', '1-1-1', '0-0-1' into
        human spoken instructions for English, Hindi, Telugu, and Marathi.
        """
        combined = f"{dosage_str or ''} {freq_str or ''}".strip()
        match = re.search(r'\b([0-9xX]+(?:\.[0-9]+)?)\s*[-–—\/]\s*([0-9xX]+(?:\.[0-9]+)?)\s*[-–—\/]\s*([0-9xX]+(?:\.[0-9]+)?)\b', combined)

        if match:
            def parse_val(v_str):
                if not v_str or v_str.upper() in ('X', '0', '0.0', 'NONE', 'NIL', '-'):
                    return 0.0
                try:
                    return float(v_str)
                except ValueError:
                    return 0.0

            def get_qty(count):
                if count == 1.0:
                    if lang == 'te': return "ఒక టాబ్లెట్"
                    if lang == 'hi': return "एक गोली"
                    if lang == 'mr': return "एक गोळी"
                    return "one tablet"
                elif count == 2.0:
                    if lang == 'te': return "రెండు టాబ్లెట్లు"
                    if lang == 'hi': return "दो गोलियां"
                    if lang == 'mr': return "दोन गोळ्या"
                    return "two tablets"
                elif count == 0.5:
                    if lang == 'te': return "అర టాబ్లెట్"
                    if lang == 'hi': return "आधी गोली"
                    if lang == 'mr': return "अर्धी गोळी"
                    return "half tablet"
                else:
                    c_str = str(int(count)) if count.is_integer() else str(count)
                    if lang == 'te': return f"{c_str} టాబ్లెట్లు"
                    if lang == 'hi': return f"{c_str} गोलियां"
                    if lang == 'mr': return f"{c_str} गोळ्या"
                    return f"{c_str} tablets"

            m = parse_val(match.group(1))
            a = parse_val(match.group(2))
            n = parse_val(match.group(3))

            parts = []
            if m > 0:
                q = get_qty(m)
                if lang == 'te': parts.append(f"ఉదయం {q}")
                elif lang == 'hi': parts.append(f"सुबह {q}")
                elif lang == 'mr': parts.append(f"सकाळी {q}")
                else: parts.append(f"{q} in the morning")

            if a > 0:
                q = get_qty(a)
                if lang == 'te': parts.append(f"మధ్యాహ్నం {q}")
                elif lang == 'hi': parts.append(f"दोपहर {q}")
                elif lang == 'mr': parts.append(f"दुपारी {q}")
                else: parts.append(f"{q} in the afternoon")

            if n > 0:
                q = get_qty(n)
                if lang == 'te': parts.append(f"రాత్రి {q}")
                elif lang == 'hi': parts.append(f"रात {q}")
                elif lang == 'mr': parts.append(f"రాत्री {q}")
                else: parts.append(f"{q} at night")

            if parts:
                if lang == 'te':
                    if len(parts) == 1: return f"{parts[0]} తీసుకోండి."
                    elif len(parts) == 2: return f"{parts[0]} మరియు {parts[1]} తీసుకోండి."
                    else: return f"{parts[0]}, {parts[1]} మరియు {parts[2]} తీసుకోండి."
                elif lang == 'hi':
                    if len(parts) == 1: return f"{parts[0]} लें।"
                    elif len(parts) == 2: return f"{parts[0]} और {parts[1]} लें।"
                    else: return f"{parts[0]}, {parts[1]} और {parts[2]} लें।"
                elif lang == 'mr':
                    if len(parts) == 1: return f"{parts[0]} घ्या."
                    elif len(parts) == 2: return f"{parts[0]} आणि {parts[1]} घ्या."
                    else: return f"{parts[0]}, {parts[1]} आणि {parts[2]} घ्या."
                else:
                    if len(parts) == 1: return f"Take {parts[0]}."
                    elif len(parts) == 2: return f"Take {parts[0]} and {parts[1]}."
                    else: return f"Take {parts[0]}, {parts[1]}, and {parts[2]}."

        # Fallback for named abbreviations
        lower = combined.lower()
        if 'bd' in lower or 'twice' in lower:
            if lang == 'te': return "రోజుకు రెండు సార్లు: ఉదయం మరియు రాత్రి."
            if lang == 'hi': return "दिन में दो बार: सुबह और रात।"
            if lang == 'mr': return "दिवसातून दोन वेळा: सकाळी आणि रात्री."
            return "Take two times daily: morning and night."
        elif 'tds' in lower or 'thrice' in lower:
            if lang == 'te': return "రోజుకు మూడు సార్లు: ఉదయం, మధ్యాహ్నం మరియు రాత్రి."
            if lang == 'hi': return "दिन में तीन बार: सुबह, दोपहर और रात।"
            if lang == 'mr': return "दिवसातून तीन वेळा: सकाळी, दुपारी आणि रात्री."
            return "Take three times daily: morning, afternoon, and night."
        elif 'hs' in lower or 'bedtime' in lower:
            if lang == 'te': return "రాత్రి పడుకునే ముందు తీసుకోండి."
            if lang == 'hi': return "रात को सोने से पहले।"
            if lang == 'mr': return "रात्री झोपण्यापूर्वी."
            return "Take at bedtime."
        elif 'od' in lower or 'once' in lower:
            if lang == 'te': return "రోజుకు ఒకసారి."
            if lang == 'hi': return "दिन में एक बार।"
            if lang == 'mr': return "दिवसातून एकदा."
            return "Take once daily."
        elif 'sos' in lower or 'as needed' in lower:
            if lang == 'te': return "అవసరం ఉన్నప్పుడు మాత్రమే తీసుకోండి."
            if lang == 'hi': return "सिर्फ ज़रूरत पड़ने पर लें।"
            if lang == 'mr': return "फक्त गरज भासल्यास घ्या."
            return "Take only when needed."

        if lang == 'te': return "డాక్టర్ సూచించిన విధంగా"
        if lang == 'hi': return "डॉक्टर के निर्देशानुसार"
        if lang == 'mr': return "डॉक्टरांच्या सल्ल्यानुसार"
        return combined or "as directed"

    @classmethod
    def generate_multilingual_audio_scripts(cls, medicines_list):
        """
        Generates audio guidance scripts summarizing extracted medicines in English, Hindi, Telugu, and Marathi
        with human-friendly dosage interpretations (1 = Take, 0 = Don't take).
        """
        if not medicines_list:
            no_med_msg = {
                "en": "No medicines could be identified from this prescription. Please consult your doctor or upload a clearer photo.",
                "hi": "इस पर्चे से किसी भी दवा की पहचान नहीं हो सकी। कृपया अपने डॉक्टर से परामर्श करें या अधिक स्पष्ट तस्वीर अपलोड करें।",
                "te": "ఈ ప్రిస్క్రిప్షన్ నుండి ఎటువంటి మందులు గుర్తించబడలేదు. దయచేసి మీ వైద్యుడిని సంప్రదించండి లేదా స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి.",
                "mr": "या प्रिस्क्रिप्शनमधून कोणतीही औषधे ओळखता आली नाहीत. कृपया तुमच्या डॉक्टरांचा सल्ला घ्या किंवा स्पष्ट फोटो अपलोड करा."
            }
            return no_med_msg["en"], no_med_msg

        med_count = len(medicines_list)

        # 1. English Script
        en_parts = [f"Your prescription contains {med_count} medication{'s' if med_count > 1 else ''}."]
        for i, item in enumerate(medicines_list, start=1):
            name = item.get("name") or item.get("medicine") or "Medication"
            strength = item.get("strength") or ""
            freq = item.get("frequency") or ""
            dur = item.get("duration") or ""
            timing = item.get("timing") or ""

            spoken_dosage = cls.humanize_dosage_speech(freq, item.get("dosage", ""), lang='en')

            script_item = f"Medicine {i}: {name} {strength}."
            if spoken_dosage:
                script_item += f" Instructions: {spoken_dosage}"
            if timing:
                script_item += f" Timing: {timing}."
            if dur:
                script_item += f" Continue for: {dur}."
            en_parts.append(script_item)
        en_parts.append("Please take your medicines regularly as advised by your doctor.")
        en_script = " ".join(en_parts)

        # 2. Hindi Script (हिंदी)
        hi_parts = [f"आपके पर्चे में कुल {med_count} दवाएं पाई गई हैं।"]
        for i, item in enumerate(medicines_list, start=1):
            name = item.get("name") or item.get("medicine") or "दवा"
            strength = item.get("strength") or ""
            freq = item.get("frequency") or ""
            dur = item.get("duration") or ""
            timing = item.get("timing") or ""

            spoken_dosage = cls.humanize_dosage_speech(freq, item.get("dosage", ""), lang='hi')

            script_item = f"दवा संख्या {i}: {name} {strength}."
            if spoken_dosage:
                script_item += f" लेने का नियम: {spoken_dosage}"
            if timing:
                script_item += f" समय: {timing}."
            if dur:
                script_item += f" अवधि: {dur}."
            hi_parts.append(script_item)
        hi_parts.append("कृपया अपनी दवाएं डॉक्टर के निर्देशानुसार समय पर लें।")
        hi_script = " ".join(hi_parts)

        # 3. Telugu Script (తెలుగు)
        te_parts = [f"మీ ప్రిస్క్రిప్షన్‌లో మొత్తం {med_count} మందులు ఉన్నాయి."]
        for i, item in enumerate(medicines_list, start=1):
            name = item.get("name") or item.get("medicine") or "మందు"
            strength = item.get("strength") or ""
            freq = item.get("frequency") or ""
            dur = item.get("duration") or ""
            timing = item.get("timing") or ""

            spoken_dosage = cls.humanize_dosage_speech(freq, item.get("dosage", ""), lang='te')

            script_item = f"మందు {i}: {name} {strength}."
            if spoken_dosage:
                script_item += f" తీసుకునే విధానం: {spoken_dosage}"
            if timing:
                script_item += f" సమయం: {timing}."
            if dur:
                script_item += f" వ్యవధి: {dur}."
            te_parts.append(script_item)
        te_parts.append("దయచేసి మీ డాక్టర్ సూచించిన విధంగా మందులను క్రమం తప్పకుండా సరైన సమయానికి తీసుకోండి.")
        te_script = " ".join(te_parts)

        # 4. Marathi Script (मराठी)
        mr_parts = [f"तुमच्या प्रिस्क्रिप्शनमध्ये {med_count} औषधे आढळली आहेत."]
        for i, item in enumerate(medicines_list, start=1):
            name = item.get("name") or item.get("medicine") or "औषध"
            strength = item.get("strength") or ""
            freq = item.get("frequency") or ""
            dur = item.get("duration") or ""
            timing = item.get("timing") or ""

            spoken_dosage = cls.humanize_dosage_speech(freq, item.get("dosage", ""), lang='mr')

            script_item = f"औषध क्रमांक {i}: {name} {strength}."
            if spoken_dosage:
                script_item += f" घेण्याची पद्धत: {spoken_dosage}"
            if timing:
                script_item += f" वेळ: {timing}."
            if dur:
                script_item += f" कालावधी: {dur}."
            mr_parts.append(script_item)
        mr_parts.append("कृपया तुमची औषधे वेळेवर आणि डॉक्टरांच्या सल्ल्यानुसार घ्या.")
        mr_script = " ".join(mr_parts)

        scripts_dict = {
            "en": en_script,
            "hi": hi_script,
            "te": te_script,
            "mr": mr_script
        }

        return en_script, scripts_dict
