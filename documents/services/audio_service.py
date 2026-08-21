import re

class AudioService:
    @staticmethod
    def humanize_dosage_speech(freq_str, dosage_str, lang='en'):
        """
        Translates raw dosage codes like '1-0-1', '1-1-1', '0-0-1' into
        human spoken instructions for English, Hindi, Telugu, and Marathi.
        Rules: 1 = Take medicine, 0 = Don't take medicine.
        """
        combined = f"{dosage_str or ''} {freq_str or ''}".strip()
        match = re.search(r'\b(\d+(?:\.\d+)?)\s*[-–—\/]\s*(\d+(?:\.\d+)?)\s*[-–—\/]\s*(\d+(?:\.\d+)?)\b', combined)

        if match:
            m, a, n = float(match.group(1)), float(match.group(2)), float(match.group(3))
            
            if m > 0 and a > 0 and n > 0:
                if lang == 'te':
                    return "రోజుకు మూడు సార్లు తీసుకోండి: ఉదయం, మధ్యాహ్నం మరియు రాత్రి."
                elif lang == 'hi':
                    return "दिन में तीन बार लें: सुबह, दोपहर और रात।"
                elif lang == 'mr':
                    return "दिवसातून तीन वेळा घ्या: सकाळी, दुपारी आणि रात्री."
                return "Take three times daily: in the morning, afternoon, and at night."
            
            elif m > 0 and a == 0 and n > 0:
                if lang == 'te':
                    return "రోజుకు రెండు సార్లు తీసుకోండి: ఉదయం మరియు రాత్రి (మధ్యాహ్నం వద్దు)."
                elif lang == 'hi':
                    return "दिन में दो बार लें: सुबह और रात को (दोपहर में नहीं)।"
                elif lang == 'mr':
                    return "दिवसातून दोन वेळा घ्या: सकाळी आणि रात्री (दुपारी घेऊ नका)."
                return "Take two times daily: in the morning and at night. Skip afternoon."
            
            elif m > 0 and a > 0 and n == 0:
                if lang == 'te':
                    return "రోజుకు రెండు సార్లు తీసుకోండి: ఉదయం మరియు మధ్యాహ్నం."
                elif lang == 'hi':
                    return "दिन में दो बार लें: सुबह और दोपहर को।"
                elif lang == 'mr':
                    return "दिवसातून दोन वेळा घ्या: सकाळी आणि दुपारी."
                return "Take two times daily: in the morning and afternoon."
            
            elif m > 0 and a == 0 and n == 0:
                if lang == 'te':
                    return "రోజుకు ఒకే ఒక్కసారి ఉదయం మాత్రమే తీసుకోండి."
                elif lang == 'hi':
                    return "दिन में सिर्फ एक बार सुबह लें।"
                elif lang == 'mr':
                    return "दिवसातून फक्त एकदा सकाळी घ्या."
                return "Take once daily in the morning only."
            
            elif m == 0 and a == 0 and n > 0:
                if lang == 'te':
                    return "రోజుకు ఒకే ఒక్కసారి రాత్రి పడుకునే ముందు తీసుకోండి."
                elif lang == 'hi':
                    return "दिन में सिर्फ एक बार रात को सोने से पहले लें।"
                elif lang == 'mr':
                    return "दिवसातून फक्त एकदा रात्री झोपण्यापूर्वी घ्या."
                return "Take once daily at night before sleep."
            
            elif m == 0 and a > 0 and n > 0:
                if lang == 'te':
                    return "రోజుకు రెండు సార్లు తీసుకోండి: మధ్యాహ్నం మరియు రాత్రి."
                elif lang == 'hi':
                    return "दिन में दो बार लें: दोपहर और रात को।"
                elif lang == 'mr':
                    return "दिवसातून दोन वेळा घ्या: दुपारी आणि रात्री."
                return "Take two times daily: in the afternoon and at night."

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
