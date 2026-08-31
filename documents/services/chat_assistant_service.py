import os
import json
import logging
import urllib.request
import time
import re
from decouple import config

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = config("OLLAMA_BASE_URL", default="http://localhost:11434")
OLLAMA_CHAT_MODEL = config("OLLAMA_CHAT_MODEL", default="mistral")
OPENROUTER_API_KEY = config("OPENROUTER_API_KEY", default="")
PREFER_CLOUD_OCR = config("PREFER_CLOUD_OCR", default="false").lower() == "true"

TABLET_KNOWLEDGE_BASE = {
    "augmentin": {
        "aliases": ["augmentin", "amoxicillin", "clav", "augmentin 625", "augmentin625", "ఆగ్మెంటిన్", "ऑगमेंटिन"],
        "generic": "Amoxicillin + Clavulanic Acid (625mg / 375mg)",
        "category": "Broad-Spectrum Antibiotic",
        "purpose": "Treats severe bacterial infections of the throat, ear, chest/lungs (pneumonia), sinus, and skin.",
        "timing": "Take after meals with a full glass of water to minimize stomach upset.",
        "duration_rule": "Complete the full 5-7 days course. Do not stop early even if you feel better.",
        "precautions": "Consume fresh curd/yogurt or buttermilk 2 hours after dose to maintain healthy gut bacteria.",
        "purpose_te": "గొంతు, ఊపిరితిత్తులు, చెవి మరియు ఇతర బాక్టీరియల్ ఇన్ఫెక్షన్లను నయం చేసే బలమైన యాంటీబయాటిక్.",
        "timing_te": "కడుపులో మంట రాకుండా ఉండటానికి భోజనం లేదా అల్పాహారం తిన్న తర్వాత మాత్రమే వేసుకోవాలి.",
        "precautions_te": "డాక్టర్ చెప్పిన పూర్తి 5 రోజుల కోర్సు వాడాలి. కడుపు ఆరోగ్యం కోసం పెరుగు లేదా మజ్జిగ ఎక్కువగా తీసుకోండి.",
        "purpose_hi": "गले, फेफड़ों, कान और त्वचा के बैक्टीरियल इन्फेक्शन को ठीक करने वाली असरदार एंटीबायोटिक दवा।",
        "timing_hi": "पेट की खराबी से बचने के लिए हमेशा खाना खाने के बाद पानी के साथ लें।",
        "precautions_hi": "पूरा 5 दिन का कोर्स खत्म करें। पेट में अच्छे बैक्टीरिया बनाए रखने के लिए ताजा दही या छाछ पिएं।",
        "purpose_mr": "घसा, छाती आणि कानाच्या जिवाणू संसर्गावर मात करणारी प्रभावी अँटिबायोटिक गोळी.",
        "timing_mr": "पोटात त्रास होऊ नये म्हणून नेहमी जेवणानंतर भरपूर पाण्यासोबत घ्यावी.",
        "precautions_mr": "औषधाचा पूर्ण कोर्स पूर्ण करा. पोटाच्या आरोग्यासाठी ताजे दही आणि ताक प्यावे."
    },
    "pan-d": {
        "aliases": ["pan-d", "pand", "pan d", "pantoprazole", "pantocid", "పాన్-డి", "పాన్ డి", "पैन डी", "पैन-डी"],
        "generic": "Pantoprazole (40mg) + Domperidone (30mg SR)",
        "category": "Proton Pump Inhibitor (PPI) & Antiemetic",
        "purpose": "Treats severe acidity, gastric reflux (GERD), heartburn, stomach ulcers, and prevents vomiting/nausea.",
        "timing": "Strictly take 30 to 45 minutes before morning breakfast with plain water on an EMPTY stomach.",
        "duration_rule": "Usually taken once daily in the morning for 5 to 14 days.",
        "precautions": "Swallow whole; do not crush or chew the capsule. Avoid oily, spicy, and deep-fried foods.",
        "purpose_te": "కడుపులో తీవ్రమైన అసిడిటీ, గ్యాస్, గుండెల్లో మంట, అజీర్తి మరియు వికారాన్ని తగ్గించే మందు.",
        "timing_te": "ఉదయం అల్పాహారానికి 30 నుండి 45 నిమిషాల ముందు ఖాళీ కడుపుతో ఒక గ్లాసు నీటితో వేసుకోవాలి.",
        "precautions_te": "క్యాప్సూల్‌ను నమలకూడదు. కారం, మసాలా మరియు నూనె పదార్థాలు తగ్గించండి.",
        "purpose_hi": "पेट में अत्यधिक गैस, एसिडिटी, सीने में जलन और उल्टी/मतली को रोकने की दवा।",
        "timing_hi": "सुबह नाश्ते से 30 से 45 मिनट पहले खाली पेट एक गिलास सादे पानी के साथ लें।",
        "precautions_hi": "कैप्सूल को चबाएं नहीं। तला-भुना और ज्यादा मिर्च-मसाले वाला खाना बंद करें।",
        "purpose_mr": "पोटातील अ‍ॅसिडिटी, गॅसेस, छातीत जळजळ आणि उलट्या थांबवणारे औषध.",
        "timing_mr": "सकाळी नाश्त्याच्या ३० ते ४५ मिनिटे आधी रिकाम्या पोटी साध्या पाण्यासोबत घ्यावी.",
        "precautions_mr": "गोळी चावू नका. तेलकट आणि तिखट पदार्थ पूर्णपणे टाळा."
    },
    "dolo 650": {
        "aliases": ["dolo", "dolo 650", "dolo650", "paracetamol", "calpol", "crocin", "డోలో", "డోలో 650", "डोलो", "डोलो 650"],
        "generic": "Paracetamol (650mg)",
        "category": "Analgesic & Antipyretic",
        "purpose": "Quickly reduces high fever, body pain, headache, and viral symptoms.",
        "timing": "Take after food with water. Maintain a minimum 6-hour gap between doses (maximum 3 tablets in 24 hours).",
        "duration_rule": "Take only when fever or severe pain is present.",
        "precautions": "Do not take other paracetamol-containing syrups/tablets simultaneously to protect liver health.",
        "purpose_te": "తీవ్రమైన జ్వరం, ఒంటి నొప్పులు, తలనొప్పిని వేగంగా తగ్గించే సురక్షితమైన మందు.",
        "timing_te": "భోజనం తర్వాత వేసుకోవాలి. రెండు మాత్రల మధ్య కనీసం 6 గంటల వ్యవధి ఉండాలి (రోజుకు 3 కంటే ఎక్కువ వేయవద్దు).",
        "precautions_te": "పారాసిటమాల్ ఉండే ఇతర మందులను ఒకేసారి వాడవద్దు. తగినంత నీరు త్రాగండి.",
        "purpose_hi": "तेज बुखार, बदन दर्द और सिरदर्द को तुरंत कम करने वाली सुरक्षित दवा।",
        "timing_hi": "खाना खाने के बाद लें। दो खुराकों के बीच कम से कम 6 घंटे का अंतर रखें (24 घंटे में अधिकतम 3 गोलियां)।",
        "precautions_hi": "पैरासिटामोल वाली दूसरी दवाइयां एक साथ न लें। पर्याप्त पानी पिएं।",
        "purpose_mr": "तीव्र ताप, अंगदुखी आणि डोकेदुखी कमी करणारी सुरक्षित गोळी.",
        "timing_mr": "जेवणानंतर घ्यावी. दोन गोळ्यांमध्ये किमान ६ तासांचे अंतर ठेवावे.",
        "precautions_mr": "एकाच वेळी इतर पॅरासिटामॉल औषधे घेऊ नका. विश्रांती घ्या."
    },
    "metformin": {
        "aliases": ["metformin", "glycomet", "glycomet 500", "janumet", "గ్లైకోమెట్", "మెట్‌ఫార్మిన్", "मेटफॉर्मिन"],
        "generic": "Metformin Hydrochloride (500mg / 1000mg)",
        "category": "Oral Antidiabetic",
        "purpose": "Lowers blood glucose by improving cellular sensitivity to natural insulin in Type 2 Diabetes.",
        "timing": "Take with or immediately after major meals (breakfast/dinner) to prevent stomach irritation.",
        "duration_rule": "Long-term daily maintenance medication as prescribed by doctor.",
        "precautions": "Never skip meals after taking Metformin to avoid sudden weakness. Carry glucose or fruit candy for emergencies.",
        "purpose_te": "టైప్ 2 మధుమేహంలో రక్తంలో చక్కెర (బ్లడ్ షుగర్) స్థాయిని అదుపులో ఉంచే మందు.",
        "timing_te": "కడుపులో అసౌకర్యం రాకుండా భోజనం తింటున్నప్పుడు లేదా భోజనం చేసిన వెంటనే వేసుకోవాలి.",
        "precautions_te": "మందు వేసుకున్నాక భోజనం మానేయవద్దు. ఎల్లప్పుడూ కొద్దిగా పండ్లు లేదా గ్లూకోజ్ వెంట ఉంచుకోండి.",
        "purpose_hi": "टाइप 2 डायबिटीज में खून की शुगर को नियंत्रित रखने की प्रमुख दवा।",
        "timing_hi": "पेट की परेशानी से बचने के लिए भोजन के साथ या भोजन के तुरंत बाद लें।",
        "precautions_hi": "दवा लेने के बाद खाना न छोड़ें। चक्कर या कमजोरी महसूस होने पर तुरंत मीठा खाएं।",
        "purpose_mr": "रक्तातील साखरेचे प्रमाण नियंत्रणात ठेवणारे मधुमेहावरील औषध.",
        "timing_mr": "जेवणासोबत किंवा जेवणानंतर लगेच घ्यावी.",
        "precautions_mr": "गोळी घेतल्यानंतर जेवण टाळू नका. चक्कर आल्यास गोड काहीतरी खावे."
    },
    "telmisartan": {
        "aliases": ["telmisartan", "telma", "telma 40", "stamlo", "టెల్మా", "టెల్మిసార్టన్", "टेल्मा"],
        "generic": "Telmisartan (40mg / 80mg) - Telma / Stamlo",
        "category": "Angiotensin II Receptor Antagonist (Antihypertensive)",
        "purpose": "Relaxes blood vessels and lowers high blood pressure, protecting the heart and kidneys.",
        "timing": "Take once daily in the morning at the exact same hour, with or without food.",
        "duration_rule": "Regular daily blood pressure management.",
        "precautions": "Limit raw salt, papad, and pickles. Do not stop taking abruptly without physician consultation.",
        "purpose_te": "రక్తనాళాలను వదులు చేసి అధిక రక్తపోటు (హై బీపీ)ని నియంత్రించి గుండెను రక్షించే మందు.",
        "timing_te": "రోజూ ఉదయం ఒకే సమయానికి క్రమం తప్పకుండా వేసుకోవాలి.",
        "precautions_te": "ఆహారంలో ఉప్పు తగ్గించండి. డాక్టర్ సలహా లేకుండా మందును ఆపవద్దు.",
        "purpose_hi": "रक्तचाप (हाई बीपी) को सामान्य रखने और दिल की सुरक्षा करने वाली दवा।",
        "timing_hi": "रोजाना सुबह एक निश्चित समय पर पानी के साथ लें।",
        "precautions_hi": "नमक कम खाएं। बिना डॉक्टर की सलाह के दवा बीच में बंद न करें।",
        "purpose_mr": "रक्तदाब नियंत्रित ठेवून हृदयाचे रक्षण करणारे औषध.",
        "timing_mr": "दररोज सकाळी एकाच निश्चित वेळी घ्यावी.",
        "precautions_mr": "मिठाचा वापर कमी करा. डॉक्टरांच्या सल्ल्याशिवाय गोळी बंद करू नका."
    },
    "azithromycin": {
        "aliases": ["azithromycin", "azee", "azithral", "azee 500", "అజిత్రోమైసిన్", "ఎజీ", "एजिथ्रोमाइसिन"],
        "generic": "Azithromycin (500mg / 250mg) - Azee / Azithral",
        "category": "Macrolide Antibiotic",
        "purpose": "Treats bacterial throat infection, tonsillitis, chest congestion, bronchitis, and typhoid.",
        "timing": "Take once daily on an empty stomach (1 hour before food or 2 hours after food) with water.",
        "duration_rule": "Strict 3 or 5 day single-dose daily course.",
        "precautions": "Take at the exact same time every day. Complete all 3 or 5 tablets.",
        "purpose_te": "గొంతు నొప్పి, టాన్సిల్స్, ఛాతీలో కఫం మరియు ఇన్ఫెక్షన్లను తగ్గించే 3-5 రోజుల యాంటీబయాటిక్.",
        "timing_te": "రోజుకు ఒకేసారి భోజనానికి 1 గంట ముందు లేదా భోజనం తర్వాత 2 గంటలకు వేసుకోవాలి.",
        "precautions_te": "డాక్టర్ సూచించిన 3 లేదా 5 రోజుల కోర్సు పూర్తి చేయాలి.",
        "purpose_hi": "गले में खराश, टॉन्सिल, खांसी और फेफड़ों के इन्फेक्शन का 3 से 5 दिन का एंटीबायोटिक कोर्स।",
        "timing_hi": "दिन में एक बार भोजन से 1 घंटा पहले या भोजन के 2 घंटे बाद लें।",
        "precautions_hi": "दवा का 3 या 5 दिन का पूरा कोर्स समय पर खत्म करें।",
        "purpose_mr": "घसादुखी, खोकला आणि छातीतील संसर्गावर 3 ते 5 दिवसांचे अँटिबायोटिक.",
        "timing_mr": "दिवसातून एकदा जेवणाच्या १ तास आधी किंवा जेवणानंतर २ तासांनी घ्यावी.",
        "precautions_mr": "पूर्ण ३ किंवा ५ दिवसांचा डोस न चुकता पूर्ण करा."
    },
    "cetirizine": {
        "aliases": ["cetirizine", "cetzine", "levocetirizine", "levocet", "సెట్రిజిన్", "సెట్-రైజిన్", "सेट्रीजीन"],
        "generic": "Cetirizine Hydrochloride (10mg) / Levocetirizine (5mg)",
        "category": "Antihistamine (Anti-Allergy)",
        "purpose": "Relieves runny nose, sneezing, itchy throat, watery eyes, and allergic skin hives.",
        "timing": "Best taken at night before sleeping as it may cause mild relaxation or drowsiness.",
        "duration_rule": "Take for 3 to 5 days during allergy or cold episodes.",
        "precautions": "Avoid driving or operating heavy machinery after taking.",
        "purpose_te": "తుమ్ములు, జలుబు, ముక్కు కారడం మరియు దురదలను అరికట్టే అలర్జీ నివారణ మందు.",
        "timing_te": "నిద్రమత్తు కలిగించవచ్చు కాబట్టి రాత్రి పడుకునే ముందు వేసుకోవడం ఉత్తమం.",
        "precautions_te": "మందు వేసుకున్నాక వాహనాలు నడపవద్దు.",
        "purpose_hi": "छींकें, बहती नाक, एलर्जी और त्वचा की खुजली से राहत देने वाली दवा।",
        "timing_hi": "हल्की नींद आ सकती है, इसलिए रात को सोने से पहले लेना सबसे अच्छा है।",
        "precautions_hi": "दवा लेने के बाद गाड़ी न चलाएं।",
        "purpose_mr": "शिंका, सर्दी, वाहणारे नाक आणि अ‍ॅलर्जीवर आराम देणारी गोळी.",
        "timing_mr": "झोप येण्याची शक्यता असल्याने रात्री झोपण्यापूर्वी घ्यावी.",
        "precautions_mr": "गोळी घेतल्यानंतर वाहन चालवणे टाळावे."
    }
}


class AIChatService:

    @classmethod
    def match_tablet_knowledge(cls, query_text, lang="en"):
        """Look up in-memory pharmacology knowledge base with aliases for offline matching if explicitly needed."""
        q_lower = query_text.lower()
        matched = []

        for key, data in TABLET_KNOWLEDGE_BASE.items():
            aliases = data.get("aliases", [key])
            if any(alias in q_lower for alias in aliases) or data['generic'].lower() in q_lower:
                matched.append((key, data))
                break

        if not matched:
            return None

        key, data = matched[0]
        if lang in ["te", "telugu"]:
            return (
                f"💊 **{key.upper()} ({data['generic']}) వివరాలు:**\n\n"
                f"🎯 **ఉపయోగం:** {data['purpose_te']}\n"
                f"⏰ **ఎలా వేసుకోవాలి:** {data['timing_te']}\n"
                f"🛡️ **జాగ్రత్తలు:** {data['precautions_te']}\n\n"
                f"⚠️ *గమనిక: డాక్టర్ చెప్పిన సమయానికి మాత్రమే మందులు వాడండి.*"
            )
        elif lang in ["hi", "hindi"]:
            return (
                f"💊 **{key.upper()} ({data['generic']}) की जानकारी:**\n\n"
                f"🎯 **उपयोग:** {data['purpose_hi']}\n"
                f"⏰ **लेने का सही समय:** {data['timing_hi']}\n"
                f"🛡️ **सावधानियां:** {data['precautions_hi']}\n\n"
                f"⚠️ *नोट: डॉक्टर के बताए अनुसार ही पूरा कोर्स लें।*"
            )
        elif lang in ["mr", "marathi"]:
            return (
                f"💊 **{key.upper()} ({data['generic']}) माहिती:**\n\n"
                f"🎯 **उपयोग:** {data['purpose_mr']}\n"
                f"⏰ **घेण्याची वेळ:** {data['timing_mr']}\n"
                f"🛡️ **काळजी:** {data['precautions_mr']}\n\n"
                f"⚠️ *टीप: डॉक्टरांच्या सल्ल्यानुसार औषध वेळेवर घ्या.*"
            )
        else:
            return (
                f"💊 **{key.upper()} ({data['generic']}) Clinical Information:**\n\n"
                f"🎯 **Purpose:** {data['purpose']}\n"
                f"⏰ **Timing & Dosage:** {data['timing']}\n"
                f"🛡️ **Clinical Guidance:** {data['precautions']}\n\n"
                f"⚠️ *Note: Follow your physician's prescribed schedule strictly.*"
            )

    @classmethod
    def generate_chat_response(cls, messages_history, prescription_context=None, user=None, lang="en"):
        start_t = time.time()
        
        lang_names = {'te': 'Telugu', 'hi': 'Hindi', 'mr': 'Marathi', 'en': 'English'}
        lang_name = lang_names.get((lang or 'en').lower(), 'English')

        # Build dynamic clinical system prompt with patient safety guardrails
        custom_system_prompt = f"""You are SevaHealth AI Sahayak, a professional medical information assistant helping a patient understand their healthcare information.

You have two core responsibilities:
1. Answer questions about the patient's latest completed prescription using the provided prescription context below.
2. Answer general medical and health-information questions using your general medical knowledge.

PRESCRIPTION RULES:
- When the patient asks about their medicines, dosage, frequency, duration, timing, or instructions, use the supplied prescription context.
- Do not invent prescription information.
- Do not guess missing dosage, frequency, duration, or medicine names.
- If the requested information is not present in the prescription context, clearly state that the information is not available in the extracted prescription.
- Do not silently replace prescription information with general assumptions.
- Treat low-confidence or `needs_verification` information cautiously.
- Do not modify or rewrite the patient's prescription.
- Do not create a new prescription.
- Do not change the doctor's dosage instructions.

GENERAL QUESTION RULES:
- General medical questions should be answered normally using general medical knowledge.
- Do not unnecessarily mention the patient's prescription when the question is unrelated.
- Explain medical terminology in simple patient-friendly language.
- Respond in the patient's requested language: {lang_name}.

SAFETY:
- Do not claim to diagnose a patient from insufficient information.
- Do not invent patient-specific medical facts.
- For potentially serious symptoms, recommend appropriate professional medical evaluation.
- For medication-specific decisions where prescription information is unclear or insufficient, advise the patient to confirm with their doctor or pharmacist.
"""

        if prescription_context:
            custom_system_prompt += f"\n\nPATIENT'S LATEST COMPLETED PRESCRIPTION CONTEXT:\n{json.dumps(prescription_context, indent=2)}"
        else:
            custom_system_prompt += "\n\nPATIENT'S LATEST COMPLETED PRESCRIPTION CONTEXT: No completed prescription available for this patient."

        # Format last 10 messages for conversation history context
        formatted_messages = [{"role": "system", "content": custom_system_prompt}]
        for msg in (messages_history or [])[-10:]:
            role = "user" if msg.get("sender") == "user" else "assistant"
            text = msg.get("text") or msg.get("content") or ""
            if text.strip():
                formatted_messages.append({"role": role, "content": text.strip()})

        # 1. Primary Engine: Cloud OpenRouter LLM (Active whenever API key is present)
        chat_model = os.getenv("OPENROUTER_CHAT_MODEL", "openai/gpt-4o-mini")
        if OPENROUTER_API_KEY:
            try:
                payload = {
                    "model": chat_model,
                    "messages": formatted_messages,
                    "temperature": 0.4,
                    "max_tokens": 600
                }
                
                req = urllib.request.Request(
                    "https://openrouter.ai/api/v1/chat/completions",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    }
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        reply = data["choices"][0]["message"]["content"].strip()
                        elapsed = round(time.time() - start_t, 2)
                        return {
                            "status": "success",
                            "response": reply,
                            "model": f"openrouter/{chat_model}",
                            "duration": elapsed
                        }
            except Exception as e:
                logger.warning(f"[CHAT OPENROUTER WARN] OpenRouter chat failed, falling back to local Ollama: {e}")

        # 2. Secondary Engine: Local Ollama Mistral LLM Fallback
        url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat"
        payload = {
            "model": OLLAMA_CHAT_MODEL,
            "messages": formatted_messages,
            "stream": False,
            "options": {"temperature": 0.4, "top_p": 0.9, "num_ctx": 2048}
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    reply = data.get("message", {}).get("content", "").strip()
                    elapsed = round(time.time() - start_t, 2)
                    if reply:
                        return {"status": "success", "response": reply, "model": OLLAMA_CHAT_MODEL, "duration": elapsed}
        except Exception as e:
            logger.error(f"[AI CHAT ERROR] Local Ollama call failed: {str(e)}")

        # 3. Emergency Offline Fallback Text
        if lang in ["te", "telugu"]:
            fallback = "మీ ప్రిస్క్రిప్షన్‌లోని మందులను డాక్టర్ సూచించిన వేళలకు వేసుకోవాలి. ఏవైనా సందేహాలు ఉంటే మీ డాక్టర్‌ను లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి."
        elif lang in ["hi", "hindi"]:
            fallback = "अपनी दवाइयों को डॉक्टर के बताए समय पर ही लें। किसी भी संदेह या तकलीफ की स्थिति में तुरंत अपने डॉक्टर से परामर्श करें।"
        elif lang in ["mr", "marathi"]:
            fallback = "आपली औषधे डॉक्टरांनी सांगितलेल्या वेळेनुसार वेळेवर घ्या. काही शंका असल्यास डॉक्टरांचा किंवा फार्मसिस्टचा सल्ला घ्या."
        else:
            fallback = "Take your prescribed medications as directed by your physician. For specific medical questions or unclear instructions, please consult your doctor or pharmacist."

        return {"status": "fallback", "response": fallback, "model": "seva-clinical-fallback", "duration": round(time.time() - start_t, 2)}
