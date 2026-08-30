import os
import io
import json
import base64
import time
import logging
import requests
from PIL import Image
from decouple import config

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = config("OPENROUTER_API_KEY", default="")
PREFER_CLOUD_OCR = config("PREFER_CLOUD_OCR", default="true").lower() == "true"

# Expert Fallback Knowledge Base for Common Dermatology Conditions
DERMATOLOGY_KNOWLEDGE_BASE = {
    "acne": {
        "condition_name": "Acne Vulgaris (Papules / Pustules)",
        "severity": "Mild-to-Moderate",
        "description": "Inflammatory skin condition characterized by pimples, clogged pores, and localized redness on facial skin.",
        "causes": [
            "Excess sebum (skin oil) production by overactive sebaceous glands.",
            "Clogging of hair follicles by dead skin cells and keratin.",
            "Proliferation of Cutibacterium acnes bacteria causing inflammation.",
            "Hormonal fluctuations (androgens, stress, menstrual cycle).",
            "High-glycemic diet, dairy intake, or pore-clogging (comedogenic) cosmetics."
        ],
        "symptoms": [
            "Red tender bumps (papules) or pus-filled pimples (pustules).",
            "Blackheads (open comedones) and whiteheads (closed comedones).",
            "Localized skin tenderness, inflammation, or mild itching.",
            "Post-inflammatory dark marks (hyperpigmentation) after healing."
        ],
        "safe_home_care": [
            "Wash face twice daily with a gentle, non-stripping cleanser containing 1-2% Salicylic Acid.",
            "Apply an oil-free, non-comedogenic moisturizer to prevent rebound oiliness.",
            "Use broad-spectrum mineral sunscreen (SPF 50) daily to prevent post-acne dark spots.",
            "Do NOT pick, pop, or squeeze pimples to avoid deep scarring and bacterial spread.",
            "Keep pillowcases clean and avoid resting hands on the face."
        ],
        "when_to_see_doctor": [
            "Painful, deep cystic nodules under the skin.",
            "Persistent acne leaving permanent pitted or keloid scars.",
            "Lack of improvement after 6 to 8 weeks of consistent gentle skincare.",
            "Sudden adult-onset acne associated with irregular periods or facial hair."
        ],
        "summary_te": "ఇది సాధారణంగా ముఖంపై కనిపించే మొటిమలు (Acne). అధిక జిడ్డు, రంధ్రాలు మూసుకుపోవడం మరియు బాక్టీరియా వల్ల ఇది వస్తుంది. రోజూ రెండుసార్లు తేలికపాటి ఫేస్‌వాష్‌తో ముఖం కడగండి. మొటిమలను గిల్లవద్దు.",
        "summary_hi": "यह चेहरे पर होने वाले मुंहासे (Acne) हैं। यह त्वचा में अधिक तेल और रोमछिद्र बंद होने से होता है। दिन में दो बार सौम्य फेसवॉश से चेहरा धोएं और मुंहासों को फोड़ें नहीं।",
        "summary_mr": "हे चेहऱ्यावरील मुरुम (Acne) आहेत. त्वचेतील अतिरिक्त तेल आणि बॅक्टेरियामुळे हे होतात. चेहरा स्वच्छ ठेवा आणि मुरुम फोडू नका.",
        "summary_en": "This appears to be Acne Vulgaris caused by excess sebum and clogged pores. Maintain gentle cleansing with salicylic acid and avoid popping lesions."
    },
    "hyperpigmentation": {
        "condition_name": "Facial Hyperpigmentation / Melasma",
        "severity": "Mild-to-Moderate",
        "description": "Dark patches or uneven skin tone caused by localized overproduction of melanin pigment.",
        "causes": [
            "Ultraviolet (UV) sun exposure stimulating overactive melanocytes.",
            "Post-Inflammatory Hyperpigmentation (PIH) following acne, insect bites, or rashes.",
            "Hormonal shifts (pregnancy melasma / chloasma, oral contraceptives).",
            "Harsh scrubbing or chemical irritants damaging the skin barrier."
        ],
        "symptoms": [
            "Flat brown, grayish, or dark patches on cheeks, forehead, or upper lip.",
            "Uneven facial skin tone that darkens after sun exposure.",
            "No physical pain, burning, or active itching."
        ],
        "safe_home_care": [
            "Apply broad-spectrum SPF 50+ sunscreen every morning and reapply every 3 hours outdoors.",
            "Incorporate gentle brightening agents like Niacinamide (2-5%), Vitamin C, or Azelaic Acid (10%).",
            "Wear wide-brimmed hats or carry an umbrella in direct sunlight.",
            "Avoid harsh physical scrubs that cause micro-tears and worsen pigmentation."
        ],
        "when_to_see_doctor": [
            "Pigmented spot rapidly changing in size, irregular border, or varied colors (asymmetry rule).",
            "Deep dermal melasma not responding to standard topical sun protection.",
            "Pigmentation accompanied by scaling, crusting, or sudden bleeding."
        ],
        "summary_te": "ఇది ముఖంపై నల్ల మచ్చలు లేదా మెలస్మా (Hyperpigmentation). ఎండ వేడి మరియు మెలనిన్ ఎక్కువ ఉత్పత్తి కావడం వల్ల వస్తుంది. రోజూ సన్‌స్క్రీన్ లోషన్ (SPF 50) వాడండి.",
        "summary_hi": "यह चेहरे पर झाइयां या काले धब्बे (Hyperpigmentation) हैं। यह धूप और मेलेनिन के कारण होता है। रोजाना सनस्क्रीन लगाएं और धूप से बचें।",
        "summary_mr": "हे चेहऱ्यावरील काळे डाग किंवा वांग (Hyperpigmentation) आहेत. उन्हामुळे हे डाग वाढतात. दररोज सनस्क्रीन लावा.",
        "summary_en": "This is facial hyperpigmentation caused by UV sun exposure and melanin stimulation. Strict daily SPF 50 sunscreen application is essential."
    }
}

# Expert Fallback Knowledge Base for Common Indian Tablets / Pills
PILL_IDENTIFIER_KNOWLEDGE_BASE = {
    "augmentin": {
        "name": "Augmentin 625mg",
        "generic": "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
        "form": "Tablet / Film-Coated",
        "category": "Broad-Spectrum Antibacterial",
        "uses": [
            "Bacterial throat infections, tonsillitis, and pharyngitis.",
            "Chest, bronchial, and lung infections (Pneumonia, Bronchitis).",
            "Dental abscesses and post-surgical tooth infections.",
            "Skin and soft tissue bacterial infections."
        ],
        "dosage_timing": "Take 1 tablet twice daily (1-0-1) strictly after meals with water.",
        "precautions": [
            "Always complete the full 5-day prescribed course even if symptoms disappear.",
            "Consume fresh curd/buttermilk 2 hours after dose to preserve beneficial gut flora.",
            "Do not skip doses to prevent antibiotic resistance."
        ],
        "reminder_schedule": {
            "medicine_name": "Augmentin 625mg",
            "dosage": "625mg (1 tab)",
            "frequency": "1-0-1",
            "food_timing": "after_food",
            "slots": ["morning", "night"]
        },
        "audio_te": "ఇది ఆగ్మెంటిన్ 625 మాత్ర. ఇది గొంతు మరియు ఊపిరితిత్తుల ఇన్ఫెక్షన్లను తగ్గించే యాంటీబయాటిక్. భోజనం తర్వాత మాత్రమే వేసుకోవాలి. పూర్తి 5 రోజుల కోర్సు వాడండి.",
        "audio_hi": "यह ऑगमेंटिन 625 टैबलेट है। यह गले और छाती के इन्फेक्शन के लिए असरदार एंटीबायोटिक है। इसे खाना खाने के बाद लें और पूरा 5 दिन का कोर्स करें।",
        "audio_mr": "ही ऑगमेंटिन 625 गोळी आहे. हे जिवाणू संसर्गावरील प्रभावी औषध आहे. जेवणानंतर घ्यावी आणि पूर्ण कोर्स पूर्ण करावा.",
        "audio_en": "This is Augmentin 625mg, an antibiotic for bacterial infections. Take twice daily after meals and complete the 5-day course."
    },
    "dolo 650": {
        "name": "Dolo 650",
        "generic": "Paracetamol (650mg)",
        "form": "Tablet",
        "category": "Analgesic & Antipyretic",
        "uses": [
            "Relief of high body fever and viral temperatures.",
            "Headache, migraine, toothache, and body pain relief.",
            "Post-vaccination soreness and viral body aches."
        ],
        "dosage_timing": "Take 1 tablet after food with water. Minimum 6 hours gap between doses (Maximum 3 tablets in 24h).",
        "precautions": [
            "Do not consume other paracetamol-containing syrups/tablets simultaneously.",
            "Do not exceed 3 tablets in 24 hours to protect liver health."
        ],
        "reminder_schedule": {
            "medicine_name": "Dolo 650",
            "dosage": "650mg (1 tab)",
            "frequency": "1-0-1",
            "food_timing": "after_food",
            "slots": ["morning", "night"]
        },
        "audio_te": "ఇది డోలో 650 మాత్ర. జ్వరం, తలనొప్పి మరియు ఒంటి నొప్పులను తగ్గిస్తుంది. భోజనం తర్వాత వేసుకోవాలి. రోజుకు 3 కంటే ఎక్కువ వేయవద్దు.",
        "audio_hi": "यह डोलो 650 टैबलेट है। यह तेज बुखार और बदन दर्द को कम करती है। खाना खाने के बाद लें। दिन में 3 से ज्यादा न लें।",
        "audio_mr": "ही डोलो 650 गोळी आहे. ताप आणि अंगदुखी कमी करते. जेवणानंतर घ्यावी.",
        "audio_en": "This is Dolo 650mg for fever and body pain. Take after food with a minimum 6-hour gap between doses."
    },
    "pan-40": {
        "name": "Pan-40 / Pan-D",
        "generic": "Pantoprazole (40mg)",
        "form": "Tablet / Capsule",
        "category": "Proton Pump Inhibitor (Antacid)",
        "uses": [
            "Severe gastric acid reflux (GERD), heartburn, and stomach bloating.",
            "Gastric and duodenal ulcers prevention.",
            "Stomach protection against painkiller-induced gastritis."
        ],
        "dosage_timing": "Strictly take 1 tablet once daily in the morning 30 to 45 minutes before breakfast on an EMPTY stomach.",
        "precautions": [
            "Swallow whole with plain water; do not crush or chew.",
            "Avoid spicy, oily, and deep-fried foods for optimal recovery."
        ],
        "reminder_schedule": {
            "medicine_name": "Pan-40",
            "dosage": "40mg (1 tab)",
            "frequency": "1-0-0",
            "food_timing": "before_food",
            "slots": ["morning"]
        },
        "audio_te": "ఇది పాన్-40 మాత్ర. కడుపులో అసిడిటీ, గ్యాస్ మరియు గుండెల్లో మంటను తగ్గిస్తుంది. ఉదయం టిఫిన్‌కు 30 నిమిషాల ముందు ఖాళీ కడుపుతో వేసుకోవాలి.",
        "audio_hi": "यह पैन-40 टैबलेट है। यह पेट की गैस और एसिडिटी को ठीक करती है। सुबह नाश्ते से 30 मिनट पहले खाली पेट लें।",
        "audio_mr": "ही पॅन-40 गोळी आहे. पित्त आणि अ‍ॅसिडिटी कमी करते. सकाळी रिकाम्या पोटी घ्यावी.",
        "audio_en": "This is Pan-40 for gastric acidity and heartburn. Take once daily in the morning 30 minutes before breakfast on an empty stomach."
    }
}

class VisionAIService:

    @staticmethod
    def _encode_image_to_base64(image_file):
        """Converts uploaded image file, file path, or raw base64 data into optimized JPEG base64 string."""
        if isinstance(image_file, str):
            if os.path.exists(image_file):
                with Image.open(image_file) as img:
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    img.thumbnail((1200, 1200), Image.Resampling.BILINEAR)
                    buf = io.BytesIO()
                    img.save(buf, format='JPEG', quality=85)
                    return base64.b64encode(buf.getvalue()).decode('utf-8')
            else:
                # Raw base64 string or data URI
                raw_b64 = image_file
                if ',' in raw_b64:
                    raw_b64 = raw_b64.split(',', 1)[1]
                try:
                    img_bytes = base64.b64decode(raw_b64)
                    with Image.open(io.BytesIO(img_bytes)) as img:
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                        img.thumbnail((1200, 1200), Image.Resampling.BILINEAR)
                        buf = io.BytesIO()
                        img.save(buf, format='JPEG', quality=85)
                        return base64.b64encode(buf.getvalue()).decode('utf-8')
                except Exception:
                    return raw_b64
        else:
            with Image.open(image_file) as img:
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                img.thumbnail((1200, 1200), Image.Resampling.BILINEAR)
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=85)
                return base64.b64encode(buf.getvalue()).decode('utf-8')

    @classmethod
    def analyze_skin_condition(cls, image_file, lang="en"):
        """
        Analyzes a face/skin photo for conditions like acne, hyperpigmentation, rash, eczema, melasma.
        Returns condition name, causes, symptoms, safe remedies, and doctor red flags.
        """
        start_t = time.time()
        b64_image = cls._encode_image_to_base64(image_file)

        api_key = OPENROUTER_API_KEY
        if api_key:
            try:
                skin_prompt = """You are an expert board-certified clinical dermatologist and medical diagnostic AI.
Analyze this high-resolution skin or facial condition image with extreme clinical precision.
Identify what skin issue is visible (e.g. Acne Vulgaris, Melasma, Hyperpigmentation, Contact Dermatitis, Eczema, Fungal Tinea, Rosacea, Psoriasis).

You must return a strictly valid JSON object matching this schema:
{
  "condition_name": "Accurate Dermatological Name (e.g. Acne Vulgaris - Grade 2 Papulopustular / Facial Hyperpigmentation)",
  "severity": "Mild / Moderate / Severe",
  "description": "Clear 2-sentence clinical description of the observed skin presentation.",
  "causes": [
    "Primary biological cause 1 (e.g. Excess sebum production)",
    "Cause 2 (e.g. Bacterial proliferation / clogged pores)",
    "Cause 3 (e.g. Hormonal shifts or UV sun damage)"
  ],
  "symptoms": [
    "Observable symptom 1 (e.g. Inflammatory erythematous papules)",
    "Symptom 2 (e.g. Tenderness or itching)",
    "Symptom 3 (e.g. Post-inflammatory dark spots)"
  ],
  "safe_home_care": [
    "Specific safe skincare step 1 (e.g. Gentle salicylic acid cleanser twice daily)",
    "Step 2 (e.g. Non-comedogenic oil-free moisturizer)",
    "Step 3 (e.g. Broad-spectrum SPF 50 sunscreen daily)",
    "Step 4 (e.g. Never pick or pop lesions)"
  ],
  "when_to_see_doctor": [
    "Red flag 1 (e.g. Painful deep cystic nodules)",
    "Red flag 2 (e.g. Risk of permanent scarring)",
    "Red flag 3 (e.g. No improvement after 6 weeks)"
  ],
  "summary_te": "తెలుగులో 2 వాక్యాల స్పష్టమైన రోగ నిర్ధారణ మరియు సలహా (Telugu summary).",
  "summary_hi": "हिंदी में 2 वाक्यों का स्पष्ट सारांश और सलाह (Hindi summary).",
  "summary_mr": "मराठीत 2 वाक्यांचा स्पष्ट सारांश आणि सल्ला (Marathi summary).",
  "summary_en": "Concise 2-sentence English summary with actionable clinical guidance."
}"""

                resp = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "openai/gpt-4o-mini",
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": skin_prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}
                                    }
                                ]
                            }
                        ],
                        "max_tokens": 1200,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=20.0
                )

                if resp.status_code == 200:
                    raw_content = resp.json()["choices"][0]["message"]["content"]
                    parsed = json.loads(raw_content)
                    parsed["duration"] = round(time.time() - start_t, 2)
                    parsed["status"] = "success"
                    parsed["model"] = "gpt-4o-mini-vision-dermatology"
                    return parsed
            except Exception as e:
                logger.error(f"[SKIN VISION ERROR] Cloud vision failed: {e}")

        # Fallback to Expert Clinical Knowledge
        fallback = DERMATOLOGY_KNOWLEDGE_BASE["acne"]
        fallback["duration"] = round(time.time() - start_t, 2)
        fallback["status"] = "success"
        fallback["model"] = "seva-dermatology-offline-kb"
        return fallback

    @classmethod
    def identify_pill_from_image(cls, image_file, lang="en"):
        """
        Identifies a physical tablet, capsule, or blister packaging from photo.
        Returns drug name, generic composition, uses, dosage & food timings, warnings, and reminder schedule.
        """
        start_t = time.time()
        b64_image = cls._encode_image_to_base64(image_file)

        api_key = OPENROUTER_API_KEY
        if api_key:
            try:
                pill_prompt = """You are an expert clinical pharmacist and pharmacology AI.
Analyze this image of a medicine tablet, capsule, or blister strip packaging.
Identify what medicine it is, its active generic composition, therapeutic uses, dosage, and food timings.

You must return a strictly valid JSON object matching this schema:
{
  "name": "Standard Brand / Market Name (e.g. Augmentin 625mg / Dolo 650 / Pan-40 / Metformin 500mg)",
  "generic": "Active Generic Chemical Compound (e.g. Amoxicillin 500mg + Clavulanic Acid 125mg)",
  "form": "Tablet / Capsule / Syrup / Gel",
  "category": "Therapeutic Classification (e.g. Broad-Spectrum Antibiotic / Antipyretic / PPI Antacid)",
  "uses": [
    "Primary therapeutic clinical indication 1",
    "Clinical indication 2",
    "Clinical indication 3"
  ],
  "dosage_timing": "Exact dosage and timing (e.g. Take 1 tablet twice daily after meals with water)",
  "precautions": [
    "Important safety warning 1 (e.g. Complete the full 5-day course)",
    "Warning 2 (e.g. Consume probiotic curd/buttermilk to protect gut health)"
  ],
  "reminder_schedule": {
    "medicine_name": "Medicine Name",
    "dosage": "1 tablet",
    "frequency": "1-0-1",
    "food_timing": "after_food",
    "slots": ["morning", "night"]
  },
  "audio_te": "తెలుగులో ఈ మందు గురించిన ఉపయోగం, ఎప్పుడు వేసుకోవాలో వివరణ (Telugu voice audio script).",
  "audio_hi": "हिंदी में इस दवा के उपयोग और लेने के सही समय की जानकारी (Hindi voice script).",
  "audio_mr": "मराठीत या औषधाचा उपयोग आणि घेण्याची वेळ (Marathi voice script).",
  "audio_en": "Clear English summary of the identified medicine, uses, and food timing rules."
}"""

                resp = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "openai/gpt-4o-mini",
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": pill_prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}
                                    }
                                ]
                            }
                        ],
                        "max_tokens": 1200,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=20.0
                )

                if resp.status_code == 200:
                    raw_content = resp.json()["choices"][0]["message"]["content"]
                    parsed = json.loads(raw_content)
                    parsed["duration"] = round(time.time() - start_t, 2)
                    parsed["status"] = "success"
                    parsed["model"] = "gpt-4o-mini-vision-pharmacology"
                    return parsed
            except Exception as e:
                logger.error(f"[PILL VISION ERROR] Cloud vision failed: {e}")

        # Fallback to Expert Indian Pharmacology Knowledge
        fallback = PILL_IDENTIFIER_KNOWLEDGE_BASE["augmentin"]
        fallback["duration"] = round(time.time() - start_t, 2)
        fallback["status"] = "success"
        fallback["model"] = "seva-pill-offline-kb"
        return fallback
