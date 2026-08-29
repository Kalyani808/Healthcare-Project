import re

MEDICINE_USAGE_DATABASE = {
    "augmentin": {
        "category": "Antibiotic",
        "category_te": "యాంటీబయాటిక్",
        "category_hi": "एंटीबायोटिक",
        "category_mr": "अँटीबायोटिक",
        "usage_en": "Bacterial infections of throat, chest, ear, sinus, or skin (Antibiotic)",
        "usage_te": "గొంతు, ఛాతీ, చెవి మరియు చర్మం యొక్క బాక్టీరియల్ ఇన్ఫెక్షన్ల చికిత్స కోసం (యాంటీబయాటిక్)",
        "usage_hi": "गले, छाती, कान और त्वचा के बैक्टीरिया इन्फेक्शन के इलाज के लिए (एंटीबायोटिक)",
        "usage_mr": "घसा, छाती, कान आणि त्वचेच्या जिवाणू संसर्गाच्या उपचारासाठी (अँटीबायोटिक)",
        "precautions_en": "Complete the full prescribed course even if symptoms improve early."
    },
    "amoxicillin": {
        "category": "Antibiotic",
        "category_te": "యాంటీబయాటిక్",
        "category_hi": "एंटीबायोटिक",
        "category_mr": "अँटीबायोटिक",
        "usage_en": "Broad-spectrum penicillin antibiotic treating bacterial infections",
        "usage_te": "బాక్టీరియల్ ఇన్ఫెక్షన్లను నయం చేసే యాంటీబయాటిక్ మందు",
        "usage_hi": "बैक्टीरिया संक्रमण के इलाज के लिए एंटीबायोटिक दवा",
        "usage_mr": "जिवाणू संसर्गाच्या उपचारासाठी अँटीबायोटिक",
        "precautions_en": "Take regularly at scheduled times until course is complete."
    },
    "ultracet": {
        "category": "Pain Relief & Analgesic",
        "category_te": "నొప్పి నివారిణి",
        "category_hi": "दर्द निवारक",
        "category_mr": "वेदना शामक",
        "usage_en": "Relief from moderate to severe pain, joint stiffness, and dental pain",
        "usage_te": "తీవ్రమైన నొప్పి, కీళ్ల నొప్పులు మరియు పంటి నొప్పి నివారణ కోసం",
        "usage_hi": "गंभीर दर्द, जोड़ों के दर्द और दांतों के दर्द से राहत के लिए",
        "usage_mr": "तीव्र वेदना, सांधेदुखी आणि दातांच्या वेदना कमी करण्यासाठी",
        "precautions_en": "Take after meals with water."
    },
    "pan-dsr": {
        "category": "Antacid & Gas Relief",
        "category_te": "ఎసిడిటీ మరియు గ్యాస్ నివారిణి",
        "category_hi": "एसिडिटी और गैस निवारक",
        "category_mr": "पित्त आणि गॅस निवारक",
        "usage_en": "Treats severe acidity, heartburn, acid reflux (GERD), and nausea",
        "usage_te": "తీవ్రమైన ఎసిడిటీ, గుండెల్లో మంట, గ్యాస్ మరియు వికారం నివారణ కోసం",
        "usage_hi": "गंभीर एसिडिटी, सीने में जलन, गैस और उल्टी/मतली के इलाज के लिए",
        "usage_mr": "तीव्र पित्त, छातीत जळजळ, गॅस आणि मळमळ दूर करण्यासाठी",
        "precautions_en": "Best taken empty stomach, 30 minutes before breakfast."
    },
    "pantoprazole": {
        "category": "Antacid / Proton Pump Inhibitor",
        "category_te": "ఎసిడిటీ నివారిణి",
        "category_hi": "एसिडिटी की दवा",
        "category_mr": "पित्तनाशक औषध",
        "usage_en": "Reduces excess stomach acid, relieves heartburn and stomach ulcers",
        "usage_te": "కడుపులో అదనపు ఆమ్లాన్ని తగ్గించి, మంట మరియు అల్సర్లను నయం చేయడానికి",
        "usage_hi": "पेट के अतिरिक्त एसिड को कम करता है और सीने में जलन से राहत देता है",
        "usage_mr": "पोटातील ॲसिड कमी करून जळजळ आणि अल्सरपासून आराम देतो",
        "precautions_en": "Take once daily in the morning before food."
    },
    "paracetamol": {
        "category": "Fever & Pain Relief",
        "category_te": "జ్వరం మరియు నొప్పి నివారిణి",
        "category_hi": "बुखार और दर्द निवारक",
        "category_mr": "ताप आणि वेदनाशामक",
        "usage_en": "Lowers fever, relieves headaches, body aches, and mild-to-moderate pain",
        "usage_te": "జ్వరాన్ని తగ్గించడానికి, తలనొప్పి మరియు ఒంటి నొప్పుల నివారణ కోసం",
        "usage_hi": "बुखार कम करने, सिरदर्द और बदन दर्द से राहत पाने के लिए",
        "usage_mr": "ताप कमी करण्यासाठी, डोकेदुखी आणि अंगदुखीपासून आराम मिळवण्यासाठी",
        "precautions_en": "Take after meals. Maintain at least 6 hours between doses."
    },
    "dolo": {
        "category": "Fever & Pain Relief (650mg)",
        "category_te": "జ్వరం మరియు ఒంటి నొప్పులు (650mg)",
        "category_hi": "बुखार और बदन दर्द की दवा",
        "category_mr": "ताप आणि तीव्र अंगदुखी",
        "usage_en": "Fast relief from high fever, body pain, and viral infections",
        "usage_te": "తీవ్రమైన జ్వరం, ఒంటి నొప్పులు మరియు వైరల్ ఇన్ఫెక్షన్ల నుండి ఉపశమనం",
        "usage_hi": "तेज बुखार, बदन दर्द और वायरल संक्रमण से तेजी से राहत के लिए",
        "usage_mr": "तीव्र ताप, अंगदुखी आणि व्हायरल इन्फेक्शनपासून जलद आराम",
        "precautions_en": "Do not exceed 3-4 tablets in 24 hours."
    },
    "azithromycin": {
        "category": "Antibiotic (Macrolide)",
        "category_te": "యాంటీబయాటిక్",
        "category_hi": "एंटीबायोटिक दवा",
        "category_mr": "अँटीबायोटिक",
        "usage_en": "Treats severe respiratory chest infections, tonsillitis, and typhoid",
        "usage_te": "ఛాతీ ఇన్ఫెక్షన్లు, టాన్సిల్స్ మరియు టైఫాయిడ్ బాక్టీరియల్ ఇన్ఫెక్షన్ల చికిత్స",
        "usage_hi": "छाती के इन्फेक्शन, टॉन्सिल और टाइफाइड के इलाज के लिए",
        "usage_mr": "छातीतील इन्फेक्शन, टॉन्सिल्स आणि विषमज्वराच्या उपचारासाठी",
        "precautions_en": "Take once daily at the same time."
    },
    "cetirizine": {
        "category": "Antiallergic / Antihistamine",
        "category_te": "అలెర్జీ నివారిణి",
        "category_hi": "एलर्जी की दवा",
        "category_mr": "ॲलर्जी प्रतिबंधक",
        "usage_en": "Relieves allergy symptoms, cold, runny nose, sneezing, and skin itching",
        "usage_te": "జలుబు, తుమ్ములు, ముక్కు కారడం మరియు చర్మంపై దురదల నివారణ కోసం",
        "usage_hi": "सर्दी, जुकाम, छींक, बहती नाक और त्वचा की खुजली से राहत के लिए",
        "usage_mr": "सर्दी, शिंका, नाक वाहणे आणि त्वचेवरील खाज कमी करण्यासाठी",
        "precautions_en": "May cause mild drowsiness. Best taken at night."
    },
    "aceclofenac": {
        "category": "Pain & Anti-inflammatory (NSAID)",
        "category_te": "నొప్పి మరియు వాపు నివారిణి",
        "category_hi": "दर्द और सूजन निवारक",
        "category_mr": "वेदना व सूज कमी करणारे औषध",
        "usage_en": "Relieves severe joint pain, arthritis, toothache, and muscular sprains",
        "usage_te": "కీళ్ల నొప్పులు, ఆర్థరైటిస్, పంటి నొప్పి మరియు కండరాల వాపు నివారణ",
        "usage_hi": "गठिया, जोड़ों का दर्द, दांत दर्द और मांसपेशियों के खिंचाव से राहत",
        "usage_mr": "सांधेदुखी, सूज, दातदुखी आणि स्नायूंच्या दुखण्यापासून आराम",
        "precautions_en": "Always take after food."
    },
    "zerodol-sp": {
        "category": "Pain & Swelling Relief",
        "category_te": "నొప్పి మరియు వాపు నివారిణి",
        "category_hi": "दर्द और सूजन की दवा",
        "category_mr": "वेदना మరియు सूज शामक",
        "usage_en": "Combats pain, tissue swelling, and speeds post-surgical recovery",
        "usage_te": "శరీర నొప్పి, గాయాల వాపు తగ్గించి వేగంగా కోలుకోవడానికి ఉపయోగపడుతుంది",
        "usage_hi": "दर्द, सूजन को कम करने और घाव को जल्दी ठीक करने के लिए",
        "usage_mr": "वेदना आणि सूज कमी करण्यासाठी",
        "precautions_en": "Take after meals with water."
    },
    "chymoral": {
        "category": "Anti-inflammatory Enzyme",
        "category_te": "వాపు మరియు నొప్పి నివారిణి (ఎంజైమ్)",
        "category_hi": "सूजन और दर्द निवारक (एंजाइम)",
        "category_mr": "सूज आणि वेदना शामक",
        "usage_en": "Reduces severe swelling, edema, and tissue inflammation post-injury/surgery",
        "usage_te": "గాయాలు లేదా సర్జరీ తర్వాత వచ్చే తీవ్రమైన వాపు మరియు నొప్పిని తగ్గించడానికి",
        "usage_hi": "चोट या सर्जरी के बाद की गंभीर सूजन और दर्द को कम करने के लिए",
        "usage_mr": "सूज आणि वेदना कमी करण्यासाठी",
        "precautions_en": "Take 30 minutes before meals with water."
    },
    "pan-40": {
        "category": "Antacid & Gastric Acid Inhibitor",
        "category_te": "ఎసిడిటీ మరియు గ్యాస్ నివారిణి",
        "category_hi": "एसिडिटी और गैस निवारक",
        "category_mr": "पित्त మరియు గ్యాస్ निवारक",
        "usage_en": "Reduces excess stomach acid, relieves heartburn, and heals gastric ulcers",
        "usage_te": "కడుపులో అదనపు ఆమ్లాన్ని తగ్గించి, మంట మరియు గ్యాస్ నుండి ఉపశమనం కలిగిస్తుంది",
        "usage_hi": "पेट के अतिरिक्त एसिड को कम करता है और सीने में जलन से राहत देता है",
        "usage_mr": "पोटातील ॲसिड कमी करून जळजळ दूर करतो",
        "precautions_en": "Best taken empty stomach 30 mins before breakfast."
    },
    "metformin": {
        "category": "Oral Antidiabetic",
        "category_te": "షుగర్ నియంత్రణ (డయాబెటిస్)",
        "category_hi": "मधुमेह नियंत्रण",
        "category_mr": "मधुमेह नियंत्रण",
        "usage_en": "Controls and lowers blood sugar glucose levels in Type 2 Diabetes",
        "usage_te": "రక్తంలో చక్కెర (షుగర్) స్థాయిలను నియంత్రించడానికి మరియు తగ్గించడానికి",
        "usage_hi": "टाइप-2 डायबिटीज में रक्त शर्करा (शुगर) को नियंत्रित करने के लिए",
        "usage_mr": "रक्तातील साखरेचे प्रमाण नियंत्रित ठेवण्यासाठी",
        "precautions_en": "Take with meals."
    },
    "amlodipine": {
        "category": "Blood Pressure (Antihypertensive)",
        "category_te": "రక్తపోటు (బీపీ) నియంత్రణ",
        "category_hi": "रक्तचाप नियंत्रण",
        "category_mr": "रक्तदाब नियंत्रण",
        "usage_en": "Lowers high blood pressure (hypertension) and protects heart health",
        "usage_te": "అధిక రక్తపోటును (బీపీ) తగ్గించి, గుండెను రక్షించడానికి ఉపయోగపడుతుంది",
        "usage_hi": "हाई ब्लड प्रेशर को नियंत्रित कर हृदय की रक्षा करता है",
        "usage_mr": "उच्च रक्तदाब नियंत्रित करते",
        "precautions_en": "Take regularly at the same time every day."
    },
    "telmisartan": {
        "category": "Blood Pressure & Heart Protection",
        "category_te": "బీపీ మరియు గుండె రక్షణ",
        "category_hi": "ब्लड प्रेशर और हृदय सुरक्षा",
        "category_mr": "रक्तदाब आणि हृदय संरक्षण",
        "usage_en": "Maintains normal blood pressure and protects heart & kidneys",
        "usage_te": "రక్తపోటును సాధారణ స్థాయిలో ఉంచి గుండెను కాపాడుతుంది",
        "usage_hi": "रक्तचाप को सामान्य रखकर हृदय और गुर्दे की रक्षा करता है",
        "usage_mr": "रक्तदाब नियंत्रित ठेवते",
        "precautions_en": "Take once daily."
    },
    "atorvastatin": {
        "category": "Cholesterol Lowering Statin",
        "category_te": "కొలెస్ట్రాల్ నియంత్రణ",
        "category_hi": "कोलेस्ट्रॉल कम करने की दवा",
        "category_mr": "कोलेस्ट्रॉल नियंत्रण",
        "usage_en": "Lowers bad cholesterol and protects against heart disease",
        "usage_te": "శరీరంలో చెడు కొలెస్ట్రాల్‌ను తగ్గించి గుండెపోటును నివారిస్తుంది",
        "usage_hi": "खराब कोलेस्ट्रॉल को कम कर हार्ट अटैक से बचाता है",
        "usage_mr": "कोलेस्ट्रॉल कमी करण्यास मदत करते",
        "precautions_en": "Take at night."
    }
}

class MedicineInfoService:
    @staticmethod
    def match_medicine_entry(med_name):
        if not med_name:
            return None
        clean = re.sub(r'[^a-zA-Z0-9]', '', str(med_name)).lower()
        for key, entry in MEDICINE_USAGE_DATABASE.items():
            clean_key = re.sub(r'[^a-zA-Z0-9]', '', key).lower()
            if clean_key in clean or clean in clean_key:
                return entry

        keywords = {
            "augmentin": ["augmentin", "amoxicillin", "clavam", "amoxyclav", "moxikind"],
            "ultracet": ["ultracet", "ultracit", "tramadol"],
            "pan-dsr": ["pandsr", "pan-dsr", "pand", "pantoprazole", "pantocid", "pan"],
            "paracetamol": ["paracetamol", "crocin", "dolo", "calpol", "pacimol"],
            "aceclofenac": ["aceclofenac", "zerodol", "zerodolsp", "hifenac"],
            "azithromycin": ["azithromycin", "azee", "azithral"],
            "cetirizine": ["cetirizine", "cetzine", "alerid", "levocetirizine"],
            "metformin": ["metformin", "glycomet", "glucophage"],
            "amlodipine": ["amlodipine", "amlong", "norvasc"],
            "telmisartan": ["telmisartan", "telma", "tazloc"],
            "atorvastatin": ["atorvastatin", "atorva", "lipitor"]
        }

        for p_key, aliases in keywords.items():
            for alias in aliases:
                if alias in clean or clean in alias:
                    return MEDICINE_USAGE_DATABASE.get(p_key)
        return None

    @classmethod
    def get_medicine_usage(cls, med_name, lang='en'):
        entry = cls.match_medicine_entry(med_name)
        if entry:
            if lang == 'te': return entry.get("usage_te", entry.get("usage_en"))
            elif lang == 'hi': return entry.get("usage_hi", entry.get("usage_en"))
            elif lang == 'mr': return entry.get("usage_mr", entry.get("usage_en"))
            return entry.get("usage_en", "")

        if lang == 'te': return f"వైద్యుల సూచన ప్రకారం వాడవలసిన చికిత్సా మందు ({med_name})"
        elif lang == 'hi': return f"डॉक्टर के निर्देशानुसार चिकित्सीय दवा ({med_name})"
        elif lang == 'mr': return f"डॉक्टरांनी लिहून दिलेले औषध ({med_name})"
        return f"Prescribed therapeutic medication ({med_name})"

    @classmethod
    def get_medicine_info(cls, med_name):
        entry = cls.match_medicine_entry(med_name)
        if entry:
            return f"{entry['category']}: {entry['usage_en']}."
        return f"Prescribed medication ({med_name}). Follow instructions as written on prescription."

    @classmethod
    def process_and_gate_medicines(cls, raw_medicines_list):
        confident = []
        needs_verification = []

        for item in raw_medicines_list:
            med_name = item.get("name") or item.get("medicine")
            conf = float(item.get("confidence", 0.0))

            if med_name and str(med_name).strip() and conf >= 0.75:
                enriched = dict(item)
                clean_name = str(med_name).strip().capitalize()
                enriched["name"] = clean_name
                enriched["medicine"] = clean_name

                entry = cls.match_medicine_entry(clean_name)
                enriched["category"] = entry["category"] if entry else "Prescribed Medication"
                enriched["category_te"] = entry["category_te"] if entry else "వైద్య మందు"
                enriched["category_hi"] = entry["category_hi"] if entry else "चिकित्सीय दवा"
                enriched["category_mr"] = entry["category_mr"] if entry else "वैद्यकीय औषध"

                enriched["usage"] = cls.get_medicine_usage(clean_name, 'en')
                enriched["usage_te"] = cls.get_medicine_usage(clean_name, 'te')
                enriched["usage_hi"] = cls.get_medicine_usage(clean_name, 'hi')
                enriched["usage_mr"] = cls.get_medicine_usage(clean_name, 'mr')
                enriched["info"] = cls.get_medicine_info(clean_name)

                confident.append(enriched)
            else:
                raw = item.get("raw_text") or item.get("raw_line") or str(med_name or "")
                if raw and len(raw.strip()) > 2:
                    needs_verification.append({
                        "raw_text": raw.strip(),
                        "suggested_name": str(med_name).strip() if med_name else "",
                        "strength": item.get("strength") or item.get("dosage") or "",
                        "frequency": item.get("frequency") or "",
                        "duration": item.get("duration") or "",
                        "confidence": conf,
                        "verification_reason": "Low confidence or ambiguous stroke — please verify manually"
                    })

        return confident, needs_verification
