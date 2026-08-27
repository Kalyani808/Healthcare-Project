import re
from rapidfuzz import fuzz

LAB_TEST_DATABASE = {
    "hemoglobin": {
        "canonical_name": "Hemoglobin (Hb)",
        "aliases": ["hemoglobin", "haemoglobin", "hb", "hgb", "heamoglobin", "hb percentage"],
        "category": "Complete Blood Count (CBC)",
        "unit": "g/dL",
        "normal_min": 12.0,
        "normal_max": 16.5,
        "meaning_en": "Carries oxygen from lungs to the entire body.",
        "meaning_te": "శరీరానికి ఆక్సిజన్‌ను మోసుకెళ్ళే రక్త కణం (హిమోగ్లోబిన్).",
        "meaning_hi": "पूरे शरीर में ऑक्सीजन पहुंचाने वाला आवश्यक घटक।",
        "meaning_mr": "शरीरातील सर्व अवयवांना ऑक्सिजन पुरवणारा घटक.",
        "low_label": "Low (Mild Anemia / రక్తహీనత)",
        "low_advice_en": "Indicates mild anemia/iron deficiency. Consume spinach, dates, pomegranate, jaggery, and beetroot.",
        "low_advice_te": "రక్తహీనత (ఎనీమియా) సూచన. పాలకూర, ఖర్జూరం, దానిమ్మ, బెల్లం మరియు బీట్‌రూట్ తీసుకోండి.",
        "low_advice_hi": "खून की कमी। पालक, खजूर, अनार, गुड़ और चुकंदर का सेवन करें।",
        "low_advice_mr": "अ‍ॅनिमियाची लक्षणे. पालक, खजूर, डाळिंब आणि गूळ खा.",
        "high_label": "High / Polycythemia",
        "high_advice_en": "Elevated hemoglobin. Drink plenty of fluids/water and discuss with your physician."
    },
    "wbc": {
        "canonical_name": "Total Leukocyte Count (WBC)",
        "aliases": ["wbc", "total wbc", "tlc", "total leukocyte count", "white blood cell", "total leucocyte count"],
        "category": "Complete Blood Count (CBC)",
        "unit": "/cumm",
        "normal_min": 4000,
        "normal_max": 11000,
        "meaning_en": "Infection-fighting immune defense cells.",
        "meaning_te": "శరీరంలో ఇన్ఫెక్షన్లతో పోరాడే రోగనిరోధక తెల్ల రక్త కణాలు.",
        "meaning_hi": "संक्रमण और बीमारियों से लड़ने वाली श्वेत रक्त कोशिकाएं।",
        "meaning_mr": "संसर्गाशी लढणाऱ्या पांढऱ्या रक्त पेशी.",
        "low_label": "Low (Reduced Immunity)",
        "low_advice_en": "Low white blood cells indicate lowered immune defense.",
        "low_advice_te": "రోగనిరోధక శక్తి తక్కువగా ఉందని సూచిస్తుంది.",
        "low_advice_hi": "रोग प्रतिरोधक क्षमता में कमी।",
        "low_advice_mr": "प्रतिकारशक्ती कमी असणे.",
        "high_label": "High (Infection Alert / ఇన్ఫెక్షన్)",
        "high_advice_en": "Elevated WBC usually indicates active bacterial or viral infection.",
        "high_advice_te": "శరీరంలో ఇన్ఫెక్షన్ లేదా వాపు ఉందని సూచిస్తుంది. డాక్టర్‌ని సంప్రదించండి.",
        "high_advice_hi": "शरीर में किसी संक्रमण (Infection) का संकेत।",
        "high_advice_mr": "शरीरात संसर्ग असल्याचे लक्षण."
    },
    "platelets": {
        "canonical_name": "Platelet Count",
        "aliases": ["platelet", "platelets", "platelet count", "plt"],
        "category": "Complete Blood Count (CBC)",
        "unit": "lakhs/cumm",
        "normal_min": 1.5,
        "normal_max": 4.5,
        "meaning_en": "Essential for blood clotting and stopping bleeding.",
        "meaning_te": "రక్తం గడ్డకట్టడానికి మరియు రక్తస్రావాన్ని ఆపడానికి అవసరమైన ప్లేట్‌లెట్స్.",
        "meaning_hi": "रक्त का थक्का जमाने और ब्लीडिंग रोकने के लिए आवश्यक प्लेटलेट्स।",
        "meaning_mr": "रक्त गोठण्यासाठी आवश्यक असणाऱ्या प्लेटलेट्स.",
        "low_label": "Low (Thrombocytopenia / ప్లేట్‌లెట్స్ తగ్గాయి)",
        "low_advice_en": "Low platelet count (often in viral fever/dengue). Stay hydrated, eat papaya leaf extract, kiwi.",
        "low_advice_te": "ప్లేట్‌లెట్స్ తగ్గాయి (డెంగ్యూ/వైరల్ జ్వరం కావచ్చు). కొబ్బరి నీరు, బొప్పాయి ఆకు రసం, కివీ పండ్లు తీసుకోండి.",
        "low_advice_hi": "प्लेटलेट कम। पपीते के पत्ते का रस, नारियल पानी और कीवी लें।",
        "low_advice_mr": "प्लेटलेट्स कमी. नारळ पाणी आणि पपईच्या पानांचा रस घ्या.",
        "high_label": "High Platelets",
        "high_advice_en": "Above normal range. Keep well hydrated."
    },
    "rbc": {
        "canonical_name": "RBC Count",
        "aliases": ["rbc", "rbc count", "red blood cell count", "total rbc"],
        "category": "Complete Blood Count (CBC)",
        "unit": "mil/cumm",
        "normal_min": 3.8,
        "normal_max": 5.8,
        "meaning_en": "Red blood cells providing cellular nutrition and oxygen.",
        "meaning_te": "శరీర కణాలకు ప్రాణవాయువును అందించే ఎర్ర రక్త కణాలు.",
        "meaning_hi": "कोशिकाओं तक ऑक्सीजन ले जाने वाली लाल रक्त कोशिकाएं।",
        "meaning_mr": "शरीरास ऑक्सिजन पुरवणाऱ्या तांबड्या पेशी.",
        "low_label": "Low RBC Count",
        "low_advice_en": "Low red blood cells indicate anemia. Consume iron and B12 rich foods.",
        "high_label": "High RBC Count",
        "high_advice_en": "Above normal range. Drink plenty of water."
    },
    "fasting_glucose": {
        "canonical_name": "Fasting Blood Sugar (FBS)",
        "aliases": ["fbs", "fasting blood sugar", "fasting glucose", "glucose fasting", "sugar fasting", "blood sugar fasting"],
        "category": "Diabetes / Glucose Profile",
        "unit": "mg/dL",
        "normal_min": 70.0,
        "normal_max": 100.0,
        "meaning_en": "Morning fasting blood sugar level.",
        "meaning_te": "ఉదయం ఖాళీ కడుపుతో ఉండే రక్తంలో చక్కెర స్థాయి (షుగర్).",
        "meaning_hi": "खाली पेट रक्त शर्करा (शुगर) का स्तर।",
        "meaning_mr": "उपाशीपोटी रक्तातील साखरेचे प्रमाण.",
        "low_label": "Low (Hypoglycemia / తక్కువ షుగర్)",
        "low_advice_en": "Low blood sugar. Consume quick carbs or glucose water immediately.",
        "low_advice_te": "షుగర్ తగ్గింది. వెంటనే కొద్దిగా గ్లూకోజ్ నీరు లేదా అరటిపండు తీసుకోండి.",
        "low_advice_hi": "शुगर कम है। तुरंत मीठा या ग्लूकोज का पानी लें।",
        "low_advice_mr": "साखर कमी. त्वरित थोडे गोड पाणी किंवा बिस्कीट घ्या.",
        "high_label": "High (Hyperglycemia / ఎక్కువ షుగర్)",
        "high_advice_en": "Elevated fasting sugar indicates diabetes/pre-diabetes. Limit sweets, refined carbs, and exercise regularly.",
        "low_advice_te": "షుగర్ ఎక్కువ ఉంది. తీపి పదార్థాలు తగ్గించండి, క్రమం తప్పకుండా నడవండి మరియు డాక్టర్ సలహా పాటించండి.",
        "high_advice_hi": "डायबिटीज का संकेत। मीठा और चावल कम करें, नियमित व्यायाम करें।",
        "high_advice_mr": "रक्तातील साखर जास्त. गोड पदार्थ टाळा आणि दररोज फिरायला जा."
    },
    "pp_glucose": {
        "canonical_name": "Post Prandial Blood Sugar (PPBS)",
        "aliases": ["ppbs", "post prandial blood sugar", "pp blood sugar", "glucose pp", "sugar pp", "post lunch glucose"],
        "category": "Diabetes / Glucose Profile",
        "unit": "mg/dL",
        "normal_min": 80.0,
        "normal_max": 140.0,
        "meaning_en": "Blood sugar level 2 hours after meals.",
        "meaning_te": "భోజనం చేసిన 2 గంటల తర్వాత ఉండే చక్కెర స్థాయి.",
        "meaning_hi": "खाने के 2 घंटे बाद का ब्लड शुगर स्तर।",
        "meaning_mr": "जेवणानंतर 2 तासांनी रक्तातील साखरेची पातळी.",
        "low_label": "Low Sugar",
        "low_advice_en": "Lower than expected post-meal range.",
        "high_label": "High Post-Meal Sugar",
        "high_advice_en": "Elevated post-meal blood sugar. Control portion size and take prescribed antidiabetic medicines."
    },
    "hba1c": {
        "canonical_name": "HbA1c (3-Month Average Sugar)",
        "aliases": ["hba1c", "glycated hemoglobin", "glycohemoglobin", "glycosylated hemoglobin", "a1c"],
        "category": "Diabetes / Glucose Profile",
        "unit": "%",
        "normal_min": 4.0,
        "normal_max": 5.6,
        "meaning_en": "3-month average blood glucose control.",
        "meaning_te": "గత 3 నెలల సగటు బ్లడ్ షుగర్ నియంత్రణను తెలిపే పరీక్ష (HbA1c).",
        "meaning_hi": "पिछले 3 महीनों का औसत ब्लड शुगर नियंत्रण।",
        "meaning_mr": "मागील 3 महिन्यांतील रक्तातील साखरेचे सरासरी प्रमाण.",
        "low_label": "Excellent / Normal",
        "low_advice_en": "Excellent blood sugar management.",
        "high_label": "High (Uncontrolled Sugar / గత 3 నెలల షుగర్ ఎక్కువ)",
        "high_advice_en": "Indicates high average blood sugar over the past 90 days. Strict diet, exercise, and medical review needed.",
        "high_advice_te": "గత 3 నెలలుగా షుగర్ నియంత్రణలో లేదని సూచిస్తుంది. ఆహార నియమాలు పాటించండి మరియు డాక్టర్‌ని సంప్రదించండి.",
        "high_advice_hi": "पिछले 90 दिनों से शुगर अनियंत्रित है। खान-पान सुधारें।",
        "high_advice_mr": "साखर नियंत्रणात नाही. डॉक्टरांचा सल्ला घ्या."
    },
    "creatinine": {
        "canonical_name": "Serum Creatinine",
        "aliases": ["creatinine", "serum creatinine", "s creatinine", "sr creatinine", "creat"],
        "category": "Kidney Function Test (KFT)",
        "unit": "mg/dL",
        "normal_min": 0.6,
        "normal_max": 1.2,
        "meaning_en": "Measures kidney filtration efficiency and health.",
        "meaning_te": "కిడ్నీల పనితీరు మరియు రక్తాన్ని శుద్ధి చేసే సామర్థ్యాన్ని కొలిచే పరీక్ష.",
        "meaning_hi": "किडनी (गुर्दे) के कार्य और स्वास्थ्य की जांच।",
        "meaning_mr": "किडनीचे कार्य आणि कार्यक्षमता तपासणी.",
        "low_label": "Normal / Low",
        "low_advice_en": "Normal kidney filtration.",
        "high_label": "High (Kidney Stress / కిడ్నీ పనితీరుపై ప్రభావం)",
        "high_advice_en": "Elevated creatinine suggests kidney strain or dehydration. Drink water, avoid painkillers (NSAIDs), consult nephrologist.",
        "high_advice_te": "కిడ్నీలపై ఒత్తిడిని సూచిస్తుంది. తగినంత నీరు త్రాగండి, పెయిన్ కిల్లర్ మందులు వాడవద్దు మరియు వైద్యుడిని సంప్రదించండి.",
        "high_advice_hi": "किडनी पर दबाव का संकेत। दर्द की दवाइयां न लें और भरपूर पानी पिएं।",
        "high_advice_mr": "किडनीवर ताण. जास्त पाणी प्या आणि डॉक्टरांना दाखवा."
    },
    "blood_urea": {
        "canonical_name": "Blood Urea / BUN",
        "aliases": ["urea", "blood urea", "bun", "blood urea nitrogen"],
        "category": "Kidney Function Test (KFT)",
        "unit": "mg/dL",
        "normal_min": 15.0,
        "normal_max": 40.0,
        "meaning_en": "Waste product filtered out by healthy kidneys.",
        "meaning_te": "కిడ్నీలు శరీరం నుండి బయటకు పంపే వ్యర్థ పదార్థం.",
        "meaning_hi": "किडनी द्वारा बाहर निकाला जाने वाला अपशिष्ट पदार्थ।",
        "meaning_mr": "किडनीद्वारे शरीराबाहेर टाकले जाणारे घटक.",
        "low_label": "Normal",
        "low_advice_en": "Normal range.",
        "high_label": "High (Dehydration / Renal Load)",
        "high_advice_en": "Often caused by dehydration, high protein intake, or reduced kidney clearance."
    },
    "uric_acid": {
        "canonical_name": "Serum Uric Acid",
        "aliases": ["uric acid", "serum uric acid", "s uric acid", "sr uric acid"],
        "category": "Kidney Function Test (KFT)",
        "unit": "mg/dL",
        "normal_min": 3.5,
        "normal_max": 7.2,
        "meaning_en": "Chemical produced during purine digestion. High levels cause joint pain (Gout).",
        "meaning_te": "రక్తంలో యూరిక్ యాసిడ్ స్థాయి. ఇది ఎక్కువైతే కీళ్ల నొప్పులు (గౌట్) వస్తాయి.",
        "meaning_hi": "यूरिक एसिड बढ़ने से जोड़ों और उंगलियों में दर्द (Gout) होता है।",
        "meaning_mr": "यूरिक अ‍ॅसिड वाढल्यास सांधेदुखी (Gout) होते.",
        "low_label": "Normal",
        "low_advice_en": "Normal uric acid level.",
        "high_label": "High (Risk of Gout / కీళ్ల నొప్పుల ముప్పు)",
        "high_advice_en": "High uric acid can cause toe/joint pain and kidney stones. Drink 3L water/day, reduce red meat, tomatoes, beer.",
        "high_advice_te": "కీళ్ల నొప్పులు మరియు కిడ్నీలో రాళ్లు వచ్చే అవకాశం ఉంది. రోజూ 3 లీటర్ల నీరు త్రాగండి, మాంసాహారం తగ్గించండి.",
        "high_advice_hi": "जोड़ों के दर्द का खतरा। मांसाहार कम करें और रोज़ 3 लीटर पानी पिएं।",
        "high_advice_mr": "सांधेदुखी आणि मुतखड्याचा धोका. भरपूर पाणी प्या."
    },
    "cholesterol": {
        "canonical_name": "Total Cholesterol",
        "aliases": ["cholesterol", "total cholesterol", "serum cholesterol", "s cholesterol", "chol"],
        "category": "Lipid Profile (Heart Health)",
        "unit": "mg/dL",
        "normal_min": 125.0,
        "normal_max": 200.0,
        "meaning_en": "Total fat level in blood circulation for heart health.",
        "meaning_te": "రక్తంలో ఉండే మొత్తం కొలెస్ట్రాల్ (కొవ్వు) స్థాయి.",
        "meaning_hi": "रक्त में कुल कोलेस्ट्रॉल (फैट) का स्तर।",
        "meaning_mr": "रक्तातील एकूण चरबीचे प्रमाण.",
        "low_label": "Normal / Optimal",
        "low_advice_en": "Healthy total cholesterol level.",
        "high_label": "High (Elevated Blood Fat / కొలెస్ట్రాల్ ఎక్కువ)",
        "high_advice_en": "High cholesterol increases heart disease risk. Reduce deep fried food, butter, ghee, and do daily aerobic exercise.",
        "high_advice_te": "గుండె జబ్బుల ముప్పును పెంచుతుంది. నూనె, వేపుడు పదార్థాలు తగ్గించండి మరియు వ్యాయామం చేయండి.",
        "high_advice_hi": "हृदय रोग का खतरा। तला-भुना खाना कम करें और रोज़ व्यायाम करें।",
        "high_advice_mr": "हृदयविकाराचा धोका. तेलकट पदार्थ टाळा."
    },
    "triglycerides": {
        "canonical_name": "Triglycerides",
        "aliases": ["triglycerides", "serum triglycerides", "tg", "triglyceride"],
        "category": "Lipid Profile (Heart Health)",
        "unit": "mg/dL",
        "normal_min": 50.0,
        "normal_max": 150.0,
        "meaning_en": "Blood fat originating from excess calories, carbs, and sugars.",
        "meaning_te": "రక్తంలో ఉండే ట్రైగ్లిజరైడ్స్ కొవ్వు పదార్థం.",
        "meaning_hi": "अधिक कैलोरी और मीठे से बनने वाला रक्त वसा।",
        "meaning_mr": "रक्तातील ट्रायग्लिसराइड्स चरबी.",
        "low_label": "Normal",
        "low_advice_en": "Normal triglyceride range.",
        "high_label": "High (Fat Accumulation)",
        "high_advice_en": "Elevated triglycerides. Reduce refined sugars, alcohol, and simple carbs."
    },
    "hdl": {
        "canonical_name": "HDL Cholesterol (Good Fat)",
        "aliases": ["hdl", "hdl cholesterol", "good cholesterol", "high density lipoprotein"],
        "category": "Lipid Profile (Heart Health)",
        "unit": "mg/dL",
        "normal_min": 40.0,
        "normal_max": 60.0,
        "meaning_en": "Protective 'Good' cholesterol that clears arteries.",
        "meaning_te": "గుండెను రక్షించే మంచి కొలెస్ట్రాల్ (HDL).",
        "meaning_hi": "धमनियों को साफ रखने वाला 'अच्छा' कोलेस्ट्रॉल।",
        "meaning_mr": "हृदयाचे रक्षण करणारे 'चांगले' कोलेस्ट्रॉल.",
        "low_label": "Low (Risk Factor / మంచి కొవ్వు తక్కువ)",
        "low_advice_en": "Low good cholesterol. Exercise regularly, consume walnuts, flax seeds, olive oil.",
        "high_label": "Optimal / High (Protective)",
        "high_advice_en": "Excellent heart protection level."
    },
    "ldl": {
        "canonical_name": "LDL Cholesterol (Bad Fat)",
        "aliases": ["ldl", "ldl cholesterol", "bad cholesterol", "low density lipoprotein"],
        "category": "Lipid Profile (Heart Health)",
        "unit": "mg/dL",
        "normal_min": 60.0,
        "normal_max": 100.0,
        "meaning_en": "'Bad' cholesterol that can cause arterial plaque buildup.",
        "meaning_te": "రక్తనాళాల్లో పేరుకుపోయే చెడు కొలెస్ట్రాల్ (LDL).",
        "meaning_hi": "धमनियों को ब्लॉक करने वाला 'खराब' कोलेस्ट्रॉल।",
        "meaning_mr": "रक्तवाहिन्यांमध्ये अडथळा आणणारे 'वाईट' कोलेस्ट्रॉल.",
        "low_label": "Optimal",
        "low_advice_en": "Optimal low risk range.",
        "high_label": "High (Arterial Blockage Risk / చెడు కొవ్వు ఎక్కువ)",
        "high_advice_en": "High bad cholesterol can cause artery blockages. Eat high-fiber diet, oats, reduce saturated fats."
    },
    "tsh": {
        "canonical_name": "Thyroid Stimulating Hormone (TSH)",
        "aliases": ["tsh", "thyroid stimulating hormone", "s tsh", "sr tsh"],
        "category": "Thyroid Profile",
        "unit": "uIU/mL",
        "normal_min": 0.4,
        "normal_max": 4.5,
        "meaning_en": "Hormone controlling body metabolism, weight, and energy levels.",
        "meaning_te": "శరీర మెటబాలిజం మరియు శక్తిని నియంత్రించే థైరాయిడ్ హార్మోన్ (TSH).",
        "meaning_hi": "शरीर के मेटाबॉलिज्म, वजन और ऊर्जा को नियंत्रित करने वाला थायरॉयड हार्मोन।",
        "meaning_mr": "शरीराचे वजन आणि ऊर्जा नियंत्रित करणारा थायरॉईड संप्रेरक.",
        "low_label": "Low (Hyperthyroidism)",
        "low_advice_en": "Indicates overactive thyroid. Consult an endocrinologist.",
        "high_label": "High (Hypothyroidism / థైరాయిడ్ సమస్య)",
        "high_advice_en": "Indicates underactive thyroid (fatigue, weight gain). Doctor may prescribe Thyronorm/Levothyroxine.",
        "high_advice_te": "హైపోథైరాయిడిజం (బరువు పెరగడం, అలసట). డాక్టర్ థైరాయిడ్ మందులు సూచిస్తారు.",
        "high_advice_hi": "थायरॉयड की कमी (सुस्ती, वजन बढ़ना)। डॉक्टर से दवा लें।",
        "high_advice_mr": "हायपोथायरॉईडीझम. डॉक्टरांचा सल्ला घ्या."
    },
    "sgpt": {
        "canonical_name": "SGPT / ALT (Liver Enzyme)",
        "aliases": ["sgpt", "alt", "alanine aminotransferase", "sgpt/alt", "serum alt"],
        "category": "Liver Function Test (LFT)",
        "unit": "U/L",
        "normal_min": 7.0,
        "normal_max": 45.0,
        "meaning_en": "Key liver enzyme reflecting liver cellular health.",
        "meaning_te": "కాలేయం (లివర్) పనితీరును తెలిపే ఎంజైమ్.",
        "meaning_hi": "लिवर (जिगर) के स्वास्थ्य और कार्यप्रणाली को दर्शाने वाला एंजाइम।",
        "meaning_mr": "यकृताचे (लिव्हर) कार्य दर्शवणारे एन्झाइम.",
        "low_label": "Normal",
        "low_advice_en": "Normal liver enzyme range.",
        "high_label": "High (Liver Stress / Fatty Liver / కాలేయ సమస్య)",
        "high_advice_en": "Elevated liver enzymes (Fatty Liver or alcohol/medication stress). Avoid alcohol, junk food, lose weight.",
        "high_advice_te": "కాలేయంపై వాపు లేదా ఫ్యాటీ లివర్ సూచన. ఆల్కహాల్, వేపుడు ఆహారాలు మానేయండి.",
        "high_advice_hi": "फैटी लिवर या सूजन का संकेत। शराब और तली चीजें न लें।",
        "high_advice_mr": "लिव्हरवर ताण किंवा फॅटी लिव्हर. जंक फूड टाळा."
    },
    "sgot": {
        "canonical_name": "SGOT / AST (Liver Enzyme)",
        "aliases": ["sgot", "ast", "aspartate aminotransferase", "sgot/ast"],
        "category": "Liver Function Test (LFT)",
        "unit": "U/L",
        "normal_min": 8.0,
        "normal_max": 40.0,
        "meaning_en": "Enzyme present in liver and heart muscles.",
        "meaning_te": "కాలేయం మరియు కండరాలలో ఉండే ఎంజైమ్.",
        "meaning_hi": "लिवर और मांसपेशियों में पाया जाने वाला एंजाइम।",
        "meaning_mr": "लिव्हर आणि स्नायूंमधील घटक.",
        "low_label": "Normal",
        "low_advice_en": "Normal range.",
        "high_label": "High (Liver/Muscle Inflammation)",
        "high_advice_en": "Indicates liver or muscle inflammation."
    },
    "bilirubin": {
        "canonical_name": "Total Bilirubin (Jaundice Test)",
        "aliases": ["bilirubin", "total bilirubin", "serum bilirubin", "s bilirubin", "bili total"],
        "category": "Liver Function Test (LFT)",
        "unit": "mg/dL",
        "normal_min": 0.2,
        "normal_max": 1.2,
        "meaning_en": "Yellow bile pigment. High levels cause yellowing of eyes/skin (Jaundice).",
        "meaning_te": "కామెర్లు (జాండిస్) వ్యాధిని గుర్తించే పరీక్ష.",
        "meaning_hi": "पीलिया (Jaundice) की जांच। उच्च स्तर पर आंखें और पेशाब पीला होता है।",
        "meaning_mr": "कावीळ (Jaundice) तपासणी.",
        "low_label": "Normal",
        "low_advice_en": "Normal range.",
        "high_label": "High (Jaundice Alert / కామెర్లు)",
        "high_advice_en": "Elevated bilirubin indicates jaundice/liver bile obstruction. Eat light boiled food, sugarcane juice, consult physician.",
        "high_advice_te": "కామెర్ల సూచన. నూనె లేని తేలికపాటి ఆహారం తీసుకోండి మరియు వైద్యుడిని సంప్రదించండి.",
        "high_advice_hi": "पीलिया का संकेत। उबला हुआ सादा भोजन लें और डॉक्टर से मिलें।",
        "high_advice_mr": "काविळीचे लक्षण. साधे जेवण घ्या."
    },
    "vitamin_d": {
        "canonical_name": "Vitamin D (25-OH)",
        "aliases": ["vitamin d", "vit d", "25-oh vitamin d", "vitamin d3", "25 hydroxy"],
        "category": "Vitamins & Bone Health",
        "unit": "ng/mL",
        "normal_min": 30.0,
        "normal_max": 100.0,
        "meaning_en": "Crucial for calcium absorption, strong bones, and immunity.",
        "meaning_te": "ఎముకల బలం మరియు రోగనిరోధక శక్తికి అవసరమైన విటమిన్ డి.",
        "meaning_hi": "हड्डियों की मजबूती और रोग प्रतिरोधक क्षमता के लिए आवश्यक विटामिन डी।",
        "meaning_mr": "हाडांच्या मजबुतीसाठी आवश्यक जीवनसत्व ड.",
        "low_label": "Deficient (విటమిన్ డి లోపం)",
        "low_advice_en": "Vitamin D deficiency causes body ache and weak bones. 20 mins morning sunlight exposure and Vit D3 supplements.",
        "low_advice_te": "విటమిన్ డి లోపం (ఎముకల బలహీనత). ఉదయం 20 నిమిషాలు ఎండలో నిలబడండి మరియు డాక్టర్ సలహాతో సప్లిమెంట్ వాడండి.",
        "low_advice_hi": "विटामिन डी की कमी। सुबह 20 मिनट धूप में बैठें।",
        "low_advice_mr": "विटामिन डी ची कमतरता. सकाळच्या कोवळ्या उन्हात बसावे.",
        "high_label": "Normal / Sufficient",
        "high_advice_en": "Healthy vitamin D levels."
    },
    "vitamin_b12": {
        "canonical_name": "Vitamin B12",
        "aliases": ["vitamin b12", "vit b12", "b12", "cyanocobalamin"],
        "category": "Vitamins & Bone Health",
        "unit": "pg/mL",
        "normal_min": 200.0,
        "normal_max": 900.0,
        "meaning_en": "Essential for nerve health, brain function, and red blood cell production.",
        "meaning_te": "నరాల బలం, మెదడు పనితీరు మరియు ఎర్ర రక్త కణాల తయారీకి అవసరమైన విటమిన్ B12.",
        "meaning_hi": "नसों की मजबूती और मस्तिष्क के लिए जरूरी विटामिन बी12।",
        "meaning_mr": "मज्जासंस्थेसाठी आवश्यक जीवनसत्व बी12.",
        "low_label": "Deficient (Nerve Weakness / నరాల బలహీనత)",
        "low_advice_en": "B12 deficiency causes tingling in hands/feet and fatigue. Consume dairy (milk, curd), eggs, or B12 supplements.",
        "low_advice_te": "విటమిన్ B12 లోపం (చేతులు, కాళ్ల తిమ్మిర్లు). పాలు, పెరుగు, గుడ్లు లేదా సప్లిమెంట్స్ తీసుకోండి.",
        "low_advice_hi": "हाथ-पैरों में झनझनाहट और कमजोरी। दूध, दही और पनीर लें।",
        "low_advice_mr": "हातपायांना मुंग्या येणे. दूध आणि दही खा.",
        "high_label": "Normal",
        "high_advice_en": "Adequate vitamin B12 level."
    }
}

def detect_document_classification(ocr_text):
    """
    Intelligently classifies whether document is a 'lab_report', 'prescription', or 'mixed'.
    """
    if not ocr_text:
        return 'prescription'

    text_lower = ocr_text.lower()

    lab_keywords = [
        "investigation", "pathology", "clinical laboratory", "lab report", "test report",
        "observed value", "reference range", "normal range", "reference interval", "unit",
        "hemoglobin", "wbc", "platelet", "serum creatinine", "blood urea", "lipid profile",
        "thyroid", "hba1c", "fasting glucose", "sgpt", "sgot", "bilirubin", "haematology",
        "biochemistry", "urine routine", "cumm", "mg/dl", "g/dl", "ng/ml", "u/l", "pg/ml"
    ]

    rx_keywords = [
        "rx", "prescription", "dr.", "doctor", "tablet", "capsule", "syrup",
        "1-0-1", "1-0-0", "0-0-1", "1-1-1", "0-1-0", "after meal", "before food",
        "at bedtime", "augmentin", "pan-dsr", "ultracet", "dolo", "paracetamol",
        "montek", "days", "od", "bd", "tds", "sos"
    ]

    lab_score = sum(1 for kw in lab_keywords if kw in text_lower)
    rx_score = sum(1 for kw in rx_keywords if kw in text_lower)

    if lab_score >= 3 and lab_score > rx_score:
        return 'lab_report'
    elif rx_score >= 2:
        return 'prescription'
    elif lab_score >= 2:
        return 'lab_report'
    return 'prescription'

def extract_lab_test_parameters(ocr_text):
    """
    Extracts structured medical lab report parameters, observed values, reference ranges,
    clinical status (Normal, High, Low), and multilingual advice.
    """
    if not ocr_text or not ocr_text.strip():
        return {
            "is_lab_report": False,
            "parameters": [],
            "normal_count": 0,
            "abnormal_count": 0,
            "summary": "No lab test data detected.",
            "audio_scripts": {}
        }

    lines = [l.strip() for l in ocr_text.splitlines() if l.strip()]
    extracted_params = []
    seen_tests = set()

    for idx, line in enumerate(lines):
        line_lower = line.lower()

        # Find if any known lab test appears in this line or nearby context
        matched_key = None
        matched_data = None

        for test_key, test_data in LAB_TEST_DATABASE.items():
            if test_key in seen_tests:
                continue

            for alias in test_data["aliases"]:
                if alias in line_lower or (len(alias) >= 4 and fuzz.partial_ratio(alias, line_lower) >= 88):
                    matched_key = test_key
                    matched_data = test_data
                    break
            if matched_key:
                break

        if matched_key and matched_data:
            # Look for numerical values in this line and the next line
            search_context = line + " " + (lines[idx+1] if idx+1 < len(lines) else "")
            
            # Find numbers (e.g. 11.2, 140, 1.5, 4500)
            num_matches = re.findall(r'\b\d+(?:\.\d+)?\b', search_context)
            
            if num_matches:
                # First plausible number is the observed test result
                observed_val = None
                for n_str in num_matches:
                    val = float(n_str)
                    # Filter out stray dates like 2026 or small indices 1, 2
                    if val != 2026 and val != 2025 and val != 2024:
                        observed_val = val
                        break

                if observed_val is not None:
                    seen_tests.add(matched_key)
                    norm_min = matched_data["normal_min"]
                    norm_max = matched_data["normal_max"]

                    # Determine clinical status
                    if observed_val < norm_min:
                        status = "low"
                        status_label = matched_data.get("low_label", "Low (తక్కువ / कम)")
                        advice_en = matched_data.get("low_advice_en", "Below normal reference range.")
                        advice_te = matched_data.get("low_advice_te", "సాధారణం కంటే తక్కువగా ఉంది.")
                        advice_hi = matched_data.get("low_advice_hi", "सामान्य से कम है।")
                        advice_mr = matched_data.get("low_advice_mr", "सामान्य मर्यादेपेक्षा कमी आहे.")
                    elif observed_val > norm_max:
                        status = "high"
                        status_label = matched_data.get("high_label", "High (ఎక్కువ / अधिक)")
                        advice_en = matched_data.get("high_advice_en", "Above normal reference range.")
                        advice_te = matched_data.get("high_advice_te", "సాధారణం కంటే ఎక్కువగా ఉంది.")
                        advice_hi = matched_data.get("high_advice_hi", "सामान्य से अधिक है।")
                        advice_mr = matched_data.get("high_advice_mr", "सामान्य मर्यादेपेक्षा जास्त आहे.")
                    else:
                        status = "normal"
                        status_label = "Normal (సాధారణం / सामान्य)"
                        advice_en = "Within healthy reference range."
                        advice_te = "ఆరోగ్యకరమైన సాధారణ పరిధిలో ఉంది."
                        advice_hi = "स्वस्थ सामान्य सीमा के भीतर है।"
                        advice_mr = "योग्य सामान्य मर्यादेत आहे."

                    extracted_params.append({
                        "test_id": matched_key,
                        "name": matched_data["canonical_name"],
                        "category": matched_data["category"],
                        "value": observed_val,
                        "unit": matched_data["unit"],
                        "reference_range": f"{norm_min} - {norm_max} {matched_data['unit']}",
                        "status": status,
                        "status_label": status_label,
                        "meaning_en": matched_data.get("meaning_en", ""),
                        "meaning_te": matched_data.get("meaning_te", ""),
                        "meaning_hi": matched_data.get("meaning_hi", ""),
                        "meaning_mr": matched_data.get("meaning_mr", ""),
                        "advice_en": advice_en,
                        "advice_te": advice_te,
                        "advice_hi": advice_hi,
                        "advice_mr": advice_mr
                    })

    normal_count = sum(1 for p in extracted_params if p["status"] == "normal")
    abnormal_count = sum(1 for p in extracted_params if p["status"] in ["high", "low"])

    # Generate Multilingual Spoken Guidance Audio Scripts for Lab Reports
    en_audio = _generate_lab_audio_script(extracted_params, 'en')
    te_audio = _generate_lab_audio_script(extracted_params, 'te')
    hi_audio = _generate_lab_audio_script(extracted_params, 'hi')
    mr_audio = _generate_lab_audio_script(extracted_params, 'mr')

    return {
        "is_lab_report": len(extracted_params) > 0,
        "parameters": extracted_params,
        "param_count": len(extracted_params),
        "normal_count": normal_count,
        "abnormal_count": abnormal_count,
        "summary": f"Identified {len(extracted_params)} diagnostic parameters ({normal_count} Normal, {abnormal_count} Requiring Attention).",
        "audio_script": en_audio,
        "audio_scripts": {
            "en": en_audio,
            "te": te_audio,
            "hi": hi_audio,
            "mr": mr_audio
        }
    }

def _generate_lab_audio_script(params, lang='en'):
    if not params:
        if lang == 'te': return "ఈ నివేదిక నుండి ఎటువంటి ల్యాబ్ పరీక్ష ఫలితాలు గుర్తించబడలేదు."
        if lang == 'hi': return "इस रिपोर्ट से कोई लैब टेस्ट परिणाम नहीं मिला।"
        if lang == 'mr': return "या अहवालातून कोणतीही लॅब चाचणी आढळली नाही."
        return "No diagnostic test parameters were identified from this report."

    total = len(params)
    abnormal = [p for p in params if p["status"] != "normal"]

    if lang == 'te':
        parts = [f"మీ వైద్య నివేదికలో మొత్తం {total} ల్యాబ్ పరీక్షలు గుర్తించబడ్డాయి."]
        if abnormal:
            parts.append(f"వీటిలో {len(abnormal)} ఫలితాలపై ప్రత్యేక శ్రద్ధ అవసరం:")
            for p in abnormal:
                name_clean = p['name'].split('(')[0].strip()
                status_word = "సాధారణం కంటే తక్కువగా ఉంది" if p['status'] == 'low' else "సాధారణం కంటే ఎక్కువగా ఉంది"
                parts.append(f"{name_clean}: {p['value']} {p['unit']}, ఇది {status_word}. {p['advice_te']}")
        else:
            parts.append("మీ ల్యాబ్ పరీక్ష ఫలితాలన్నీ ఆరోగ్యకరమైన సాధారణ పరిధిలో ఉన్నాయి.")
        parts.append("పూర్తి చికిత్స కొరకు మీ వైద్యుడిని సంప్రదించండి.")
        return " ".join(parts)

    elif lang == 'hi':
        parts = [f"आपकी मेडिकल रिपोर्ट में कुल {total} टेस्ट परिणाम पाए गए हैं।"]
        if abnormal:
            parts.append(f"इनमें से {len(abnormal)} टेस्ट में ध्यान देने की आवश्यकता है:")
            for p in abnormal:
                name_clean = p['name'].split('(')[0].strip()
                status_word = "सामान्य से कम है" if p['status'] == 'low' else "सामान्य से अधिक है"
                parts.append(f"{name_clean}: {p['value']} {p['unit']}, यह {status_word}। {p['advice_hi']}")
        else:
            parts.append("आपके सभी टेस्ट परिणाम स्वस्थ और सामान्य सीमा में हैं।")
        parts.append("उचित सलाह के लिए अपने डॉक्टर से संपर्क करें।")
        return " ".join(parts)

    elif lang == 'mr':
        parts = [f"तुमच्या वैद्यकीय अहवालात {total} चाचण्या आढळल्या आहेत."]
        if abnormal:
            parts.append(f"यापैकी {len(abnormal)} चाचण्यांवर लक्ष देणे आवश्यक आहे:")
            for p in abnormal:
                name_clean = p['name'].split('(')[0].strip()
                status_word = "सामान्यपेक्षा कमी आहे" if p['status'] == 'low' else "सामान्यपेक्षा जास्त आहे"
                parts.append(f"{name_clean}: {p['value']} {p['unit']}, हे {status_word}. {p['advice_mr']}")
        else:
            parts.append("तुमचे सर्व चाचणी निकाल सामान्य मर्यादेत आहेत.")
        parts.append("पुढील उपचारांसाठी डॉक्टरांचा सल्ला घ्या.")
        return " ".join(parts)

    else:
        parts = [f"Your medical diagnostic report contains {total} identified test parameters."]
        if abnormal:
            parts.append(f"{len(abnormal)} parameter{'s' if len(abnormal)>1 else ''} require attention:")
            for p in abnormal:
                parts.append(f"{p['name']}: {p['value']} {p['unit']} is {p['status'].upper()} (Normal range: {p['reference_range']}). Advice: {p['advice_en']}")
        else:
            parts.append("All your tested parameters are within healthy normal reference ranges.")
        parts.append("Please share these results with your treating doctor.")
        return " ".join(parts)
