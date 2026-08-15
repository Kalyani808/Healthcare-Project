class AudioService:
    @staticmethod
    def generate_multilingual_audio_scripts(medicines_list):
        """
        Generates audio guidance scripts summarizing extracted medicines in English, Hindi, and Marathi.
        """
        if not medicines_list:
            no_med_msg = {
                "en": "No medicines could be identified from this prescription. Please consult your doctor or upload a clearer photo.",
                "hi": "इस पर्चे से किसी भी दवा की पहचान नहीं हो सकी। कृपया अपने डॉक्टर से परामर्श करें या अधिक स्पष्ट तस्वीर अपलोड करें।",
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

            script_item = f"Number {i}: {name} {strength}."
            if freq:
                script_item += f" Frequency: {freq}."
            if timing:
                script_item += f" Timing: {timing}."
            if dur:
                script_item += f" Duration: {dur}."
            en_parts.append(script_item)
        en_parts.append("Please follow the exact timings and instructions prescribed by your doctor.")
        en_script = " ".join(en_parts)

        # 2. Hindi Script (हिंदी)
        hi_parts = [f"आपके पर्चे में {med_count} दवाएं पाई गई हैं।"]
        for i, item in enumerate(medicines_list, start=1):
            name = item.get("name") or item.get("medicine") or "दवा"
            strength = item.get("strength") or ""
            freq = item.get("frequency") or ""
            dur = item.get("duration") or ""
            timing = item.get("timing") or ""

            script_item = f"दवा संख्या {i}: {name} {strength}."
            if freq:
                script_item += f" खुराक: {freq}."
            if timing:
                script_item += f" लेने का समय: {timing}."
            if dur:
                script_item += f" अवधि: {dur}."
            hi_parts.append(script_item)
        hi_parts.append("कृपया अपने डॉक्टर द्वारा बताए गए सही समय और निर्देशों का पालन करें।")
        hi_script = " ".join(hi_parts)

        # 3. Marathi Script (मराठी)
        mr_parts = [f"तुमच्या प्रिस्क्रिप्शनमध्ये {med_count} औषधे आढळली आहेत."]
        for i, item in enumerate(medicines_list, start=1):
            name = item.get("name") or item.get("medicine") or "औषध"
            strength = item.get("strength") or ""
            freq = item.get("frequency") or ""
            dur = item.get("duration") or ""
            timing = item.get("timing") or ""

            script_item = f"औषध क्रमांक {i}: {name} {strength}."
            if freq:
                script_item += f" प्रमाण: {freq}."
            if timing:
                script_item += f" घेण्याची वेळ: {timing}."
            if dur:
                script_item += f" कालावधी: {dur}."
            mr_parts.append(script_item)
        mr_parts.append("कृपया तुमच्या डॉक्टरांनी दिलेल्या सूचनांनुसार औषधे वेळेवर घ्या.")
        mr_script = " ".join(mr_parts)

        scripts_dict = {
            "en": en_script,
            "hi": hi_script,
            "mr": mr_script
        }

        return en_script, scripts_dict
