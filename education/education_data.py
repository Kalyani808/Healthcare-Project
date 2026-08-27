"""
Comprehensive Health Education Knowledge Base for Rural & Urban Community Healthcare.
Categories:
1. Preventive Healthcare Guidance
2. Maternal Health Information
3. Child Healthcare Guidance
4. Elderly Care Information
Supported Languages: Telugu (te), Hindi (hi), Marathi (mr), English (en).
"""

HEALTH_EDUCATION_GUIDES = [
    # ========================================================
    # 1. PREVENTIVE HEALTHCARE GUIDANCE
    # ========================================================
    {
        "slug": "hypertension-blood-pressure-prevention",
        "category": "preventive",
        "icon": "FaHeartbeat",
        "read_time_minutes": 3,
        "is_featured": True,
        "title": "Preventing & Managing High Blood Pressure (Hypertension)",
        "summary": "Practical daily lifestyle tips to maintain normal 120/80 mmHg blood pressure without sudden cardiac spikes.",
        "content": "High blood pressure is often a silent condition that strains the heart and blood vessels over time. Reducing dietary table salt to under 1 teaspoon (5g) daily, engaging in 30 minutes of brisk walking, eating potassium-rich bananas and spinach, and managing emotional stress can significantly stabilize systolic and diastolic pressures. Regularly check your blood pressure at your village primary health center or local clinic.",
        "key_takeaways": [
            "Limit table salt intake to less than 1 level teaspoon daily",
            "Walk briskly for 30 minutes at least 5 days a week",
            "Avoid papads, pickles, and packaged salted snacks",
            "Monitor blood pressure every 2 weeks if diagnosed"
        ],
        "title_te": "రక్తపోటు (బీపీ) నివారణ మరియు నియంత్రణ మార్గాలు",
        "summary_te": "రక్తపోటును 120/80 వద్ద ఆరోగ్యంగా ఉంచుకోవడానికి రోజువారీ జీవనశైలి చిట్కాలు.",
        "content_te": "అధిక రక్తపోటు గుండె మరియు రక్తనాళాలపై ఒత్తిడిని కలిగిస్తుంది. రోజువారీ ఆహారంలో ఉప్పును ఒక చెంచా కంటే తక్కువగా వాడడం, రోజుకు 30 నిమిషాలు వేగంగా నడవడం, అరటిపండ్లు మరియు ఆకుకూరలు ఎక్కువగా తీసుకోవడం ద్వారా బీపీని అదుపులో ఉంచుకోవచ్చు. పచ్చళ్ళు, అప్పడాలు తగ్గించాలి. ప్రతి నెలా మీ స్థానిక ప్రాథమిక ఆరోగ్య కేంద్రంలో బీపీ చెక్ చేయించుకోండి.",
        "key_takeaways_te": [
            "రోజుకు 1 చెంచా కంటే తక్కువ ఉప్పు మాత్రమే వాడండి",
            "రోజుకు కనీసం 30 నిమిషాలు వేగంగా నడవండి",
            "ఊరగాయలు మరియు ఉప్పు ఎక్కువగా ఉండే పదార్థాలు మానేయండి",
            "రక్తపోటును క్రమం తప్పకుండా పరీక్షించుకోండి"
        ],
        "title_hi": "उच्च रक्तचाप (हाई बीपी) से बचाव और नियंत्रण",
        "summary_hi": "ब्लड प्रेशर को 120/80 के सामान्य स्तर पर रखने के आसान घरेलू उपाय।",
        "content_hi": "उच्च रक्तचाप दिल और नसों पर अनावश्यक दबाव डालता है। दिनभर में 1 चम्मच से कम नमक का सेवन करें, रोज़ 30 मिनट तेज चलें, और ताजे फल-सब्जियां खाएं। अचार और पापड़ जैसी नमकीन चीजों से बचें। नियमित रूप से अपने नजदीकी स्वास्थ्य केंद्र पर बीपी की जांच कराएं।",
        "key_takeaways_hi": [
            "दिनभर में 1 छोटे चम्मच से कम नमक खाएं",
            "प्रतिदिन 30 मिनट टहलने की आदत डालें",
            "अचार, पापड़ और चिप्स का सेवन बंद करें",
            "हर 2 हफ्ते में बीपी की जांच जरूर कराएं"
        ],
        "title_mr": "उच्च रक्तदाब (हाय बीपी) प्रतिबंध आणि काळजी",
        "summary_mr": "रक्तदाब 120/80 च्या सामान्य मर्यादेत ठेवण्यासाठी सोप्या टिप्स.",
        "content_mr": "उच्च रक्तदाब हृदयाच्या आरोग्यावर परिणाम करतो. जेवणात मिठाचे प्रमाण 1 चमच्यापेक्षा कमी ठेवा, दररोज 30 मिनिटे चाला, आणि हिरव्या भाज्या खा. लोणचे आणि पापड टाळा. आरोग्य केंद्रात वेळोवेळी बीपी तपासून घ्या.",
        "key_takeaways_mr": [
            "रोजच्या आहारात मिठाचा वापर कमी करा",
            "दररोज 30 मिनिटे वेगाने चाला",
            "लोणचे आणि खारट पदार्थ टाळा",
            "नियमित रक्तदाब तपासा"
        ]
    },
    {
        "slug": "type-2-diabetes-diet-prevention",
        "category": "preventive",
        "icon": "FaVial",
        "read_time_minutes": 4,
        "is_featured": True,
        "title": "Controlling Blood Sugar (Type 2 Diabetes Prevention)",
        "summary": "Low-glycemic dietary principles, portion control, and natural strategies to prevent diabetes complications.",
        "content": "Type 2 diabetes develops when cellular insulin response weakens due to excess refined carbohydrates and physical inactivity. Replacing polished white rice with millets (Jowar, Ragi, Bajra), increasing green leafy vegetables and whole pulses, drinking fenugreek (methi) water in the morning, and maintaining ideal body weight keep fasting glucose under 100 mg/dL and HbA1c below 5.7%.",
        "key_takeaways": [
            "Switch from white polished rice to traditional millets (Ragi, Jowar)",
            "Eat whole lentils, sprouts, and bitter gourd (karela)",
            "Avoid sugar, sweet tea, sodas, and maida bakery products",
            "Test Fasting Blood Sugar (FBS) every 3 months"
        ],
        "title_te": "మధుమేహం (షుగర్ వ్యాధి) నివారణ మరియు ఆహార నియమాలు",
        "summary_te": "రక్తంలో చక్కెర స్థాయిని అదుపులో ఉంచే చిరుధాన్యాలు మరియు ఆహార పద్ధతులు.",
        "content_te": "తెల్ల అన్నం బదులుగా రాగులు, జొన్నలు, సజ్జలు వంటి చిరుధాన్యాలు వాడడం ద్వారా బ్లడ్ షుగర్‌ను నియంత్రించవచ్చు. కాకరకాయ, మెంతులు, ఆకుకూరలు మరియు మొలకెత్తిన గింజలు క్రమం తప్పకుండా ఆహారంలో చేర్చుకోండి. చక్కెర, తీపి టీ మరియు శీతల పానీయాలు మానేయండి. ఉదయం వేళ నడక రక్తంలో గ్లూకోజ్ స్థాయిని వేగంగా తగ్గిస్తుంది.",
        "key_takeaways_te": [
            "తెల్ల బియ్యం బదులు రాగులు, జొన్నల రొట్టెలు తీసుకోండి",
            "తీపి పదార్థాలు మరియు మైదా వస్తువులు మానేయండి",
            "మెంతుల నీరు మరియు తాజా ఆకుకూరలు ఎక్కువగా వాడండి",
            "ప్రతి 3 నెలలకు ఒకసారి HbA1c టెస్ట్ చేయించుకోండి"
        ],
        "title_hi": "डायबिटीज (शुगर) से बचाव और सही खान-पान",
        "summary_hi": "रक्त शर्करा को सामान्य रखने के लिए मोटा अनाज और जीवनशैली सुधार।",
        "content_hi": "सफेद चावल की जगह ज्वार, बाजरा और रागी जैसे मोटे अनाज का उपयोग करें। हरी सब्जियां, मेथी का पानी और अंकुरित अनाज शुगर को नियंत्रित रखते हैं। चीनी, मीठी चाय और मैदे की चीजों से बचें। प्रतिदिन 30 मिनट का व्यायाम इंसुलिन संवेदनशीलता को बेहतर बनाता है।",
        "key_takeaways_hi": [
            "सफेद चावल की जगह रागी और ज्वार की रोटी खाएं",
            "मीठी चाय और कोल्ड ड्रिंक्स बंद करें",
            "रोज सुबह मेथी दाने का पानी पिएं",
            "हर 3 महीने में शुगर की जांच कराएं"
        ],
        "title_mr": "मधुमेह (डायबेटीस) नियंत्रण आणि योग्य आहार",
        "summary_mr": "रक्तातील साखर नियंत्रणात ठेवण्यासाठी पारंपरिक धान्य आणि व्यायाम.",
        "content_mr": "पांढऱ्या तांदळाऐवजी ज्वारी, बाजरी आणि नाचणीची भाकरी खा. आहारात मेथी, कारले आणि कडधान्यांचा समावेश करा. साखर आणि गोड पदार्थ पूर्णपणे टाळा. रोज सकाळी फिरायला जाणे फायदेशीर ठरते.",
        "key_takeaways_mr": [
            "ज्वारी, बाजरी आणि नाचणीचा वापर वाढवा",
            "गोड पदार्थ आणि बेकरी उत्पादने टाळा",
            "नियमित 30 मिनिटे चाला",
            "दर 3 महिन्यांनी रक्तातील साखरेची तपासणी करा"
        ]
    },

    # ========================================================
    # 2. MATERNAL HEALTH INFORMATION
    # ========================================================
    {
        "slug": "maternal-prenatal-care-nutrition",
        "category": "maternal",
        "icon": "FaFemale",
        "read_time_minutes": 4,
        "is_featured": True,
        "title": "Essential Maternal Care & Pregnancy Nutrition",
        "summary": "Month-by-month prenatal guidance, Iron-Folic Acid supplementation, and safe institutional delivery tips.",
        "content": "A healthy pregnancy requires balanced maternal nutrition rich in iron, calcium, and protein. Pregnant mothers must consume daily Iron-Folic Acid (IFA) tablets from the second trimester to prevent severe maternal anemia and low birth weight. Eat green leafy vegetables, eggs, dairy, and seasonal fruits. Complete at least 4 Antenatal Checkups (ANC) at the local Primary Health Center and plan for safe institutional delivery.",
        "key_takeaways": [
            "Take 1 Iron-Folic Acid tablet daily after meals (with water, not tea)",
            "Complete minimum 4 Antenatal Care (ANC) medical checkups",
            "Eat jaggery, dates, spinach, lentils, milk, and eggs daily",
            "Watch for danger signs: severe headache, blurred vision, or bleeding"
        ],
        "title_te": "గర్భిణీ స్త్రీల ఆరోగ్యం మరియు పోషకాహార సంరక్షణ",
        "summary_te": "గర్భధారణ సమయంలో ఐరన్ మాత్రలు, సమతుల్య ఆహారం మరియు సురక్షిత ప్రసవ సలహాలు.",
        "content_te": "గర్భిణీ స్త్రీలు ఆరోగ్యంగా ఉండటానికి ఐరన్, కాల్షియం మరియు ప్రొటీన్లు అధికంగా ఉండే ఆహారం అవసరం. రక్తహీనత రాకుండా ఉండటానికి రోజూ ఐరన్-ఫోలిక్ యాసిడ్ మాత్రలను తప్పనిసరిగా వేసుకోవాలి. పాలకూర, ఖర్జూరం, బెల్లం, గుడ్లు మరియు పాలు రోజూ తీసుకోవాలి. ప్రభుత్వ ఆసుపత్రిలో కనీసం 4 గర్భధారణ పరీక్షలు (ANC) చేయించుకోవాలి మరియు సురక్షిత ప్రసవం కోసం ముందస్తుగా ఏర్పాట్లు చేసుకోవాలి.",
        "key_takeaways_te": [
            "రోజూ ఐరన్-ఫోలిక్ యాసిడ్ మాత్ర తప్పనిసరిగా వేసుకోండి",
            "కనీసం 4 సార్లు ప్రభుత్వ ఆసుపత్రిలో వైద్య పరీక్షలు చేయించుకోండి",
            "పాలకూర, ఖర్జూరం, పాలు, గుడ్లు ఆహారంలో చేర్చండి",
            "తీవ్రమైన తలనొప్పి లేదా రక్తస్రావం కనిపిస్తే వెంటనే డాక్టర్‌ను సంప్రదించండి"
        ],
        "title_hi": "गर्भावस्था में पोषण और सुरक्षित मातृत्व देखभाल",
        "summary_hi": "गर्भवती महिलाओं के लिए आवश्यक आयरन की गोलियां, पौष्टिक आहार और जांच।",
        "content_hi": "गर्भवती महिला के अच्छे स्वास्थ्य और बच्चे के विकास के लिए संतुलित आहार बहुत जरूरी है। खून की कमी (एनीमिया) से बचने के लिए रोज आयरन और फोलिक एसिड की गोली लें। पालक, गुड़, चना, दालें, दूध और अंडे खाएं। स्वास्थ्य केंद्र पर कम से कम 4 प्रसव पूर्व जांच (ANC) अवश्य कराएं और सुरक्षित प्रसव के लिए अस्पताल चुनें।",
        "key_takeaways_hi": [
            "रोजाना एक आयरन-फोलिक एसिड की गोली लें",
            "नजदीकी अस्पताल में कम से कम 4 बार एएनसी जांच कराएं",
            "पालक, गुड़, खजूर, दूध और दालों का सेवन करें",
            "तेज सिरदर्द, चक्कर या ब्लीडिंग होने पर तुरंत अस्पताल जाएं"
        ],
        "title_mr": "गर्भवती महिलांची काळजी आणि पोषण आहार",
        "summary_mr": "गर्भावस्थेतील योग्य आहार, आयर्नच्या गोळ्या आणि सुरक्षित प्रसूती मार्गदर्शन.",
        "content_mr": "गर्भवती मातेसाठी सकस आहार अत्यंत महत्त्वाचा आहे. अ‍ॅनिमिया टाळण्यासाठी दररोज आयर्न आणि फॉलिक अ‍ॅसिडच्या गोळ्या घ्याव्यात. पालक, गूळ, खजूर, दूध आणि कडधान्ये खा. प्राथमिक आरोग्य केंद्रात किमान 4 तपासण्या (ANC) पूर्ण करा.",
        "key_takeaways_mr": [
            "दररोज आयर्न-फॉलिक अ‍ॅसिडची गोळी घ्या",
            "आरोग्य केंद्रात नियमित तपासणी करा",
            "गूळ, पालक, डाळी आणि फळे खा",
            "धोक्याची लक्षणे आढळल्यास ताबडतोब दवाखान्यात जा"
        ]
    },

    # ========================================================
    # 3. CHILD HEALTHCARE GUIDANCE
    # ========================================================
    {
        "slug": "child-immunization-diarrhea-ors",
        "category": "child_care",
        "icon": "FaBaby",
        "read_time_minutes": 4,
        "is_featured": True,
        "title": "Child Immunization Schedule & Diarrhea ORS Care",
        "summary": "National childhood vaccination timeline, dehydration prevention with ORS, and balanced infant growth.",
        "content": "Timely childhood immunization protects infants from life-threatening infections like Polio, Measles, Hepatitis B, and Pneumonia. Exclusive breastfeeding for the first 6 months builds lifelong natural immunity. If a child experiences loose motions, immediately prepare Oral Rehydration Salts (ORS) solution (1 packet in 1 liter clean drinking water) and give Zinc tablets for 14 days to prevent severe dehydration.",
        "key_takeaways": [
            "Complete all national vaccines on time (BCG, OPV, Pentavalent, MR, DPT)",
            "Exclusive breastfeeding for the first 6 months (no plain water or cow milk)",
            "For diarrhea, give ORS solution after every loose motion + Zinc for 14 days",
            "Seek immediate care if child has sunken eyes, high fever, or refuses fluids"
        ],
        "title_te": "పిల్లల టీకాల పట్టిక మరియు విరేచనాలకు ఓఆర్‌ఎస్ చికిత్స",
        "summary_te": "సకాలంలో వ్యాక్సిన్లు, ఓఆర్‌ఎస్ ద్రావణం మరియు శిశు సంరక్షణ పద్ధతులు.",
        "content_te": "పోలియో, తట్టు, న్యుమోనియా వంటి ప్రాణాంతక వ్యాధుల నుండి పిల్లలను రక్షించడానికి సకాలంలో టీకాలు వేయించాలి. మొదటి 6 నెలలు తల్లిపాలు మాత్రమే పట్టించాలి. పిల్లలకు విరేచనాలు అయినప్పుడు డీహైడ్రేషన్ రాకుండా ఓఆర్‌ఎస్ (ORS) ద్రావణాన్ని కొద్దికొద్దిగా తాగిస్తూ ఉండాలి మరియు 14 రోజుల పాటు జింక్ మాత్రలు ఇవ్వాలి.",
        "key_takeaways_te": [
            "ప్రభుత్వ టీకాల పట్టిక ప్రకారం అన్ని వ్యాక్సిన్లు వేయించండి",
            "మొదటి 6 నెలలు కేవలం తల్లిపాలు మాత్రమే ఇవ్వండి",
            "విరేచనాలు అయితే వెంటనే ఓఆర్‌ఎస్ (ORS) మరియు జింక్ ఇవ్వండి",
            "పిల్లలు నీరసపడితే వెంటనే ఆసుపత్రికి తీసుకెళ్లండి"
        ],
        "title_hi": "बच्चों का टीकाकरण चार्ट और दस्त में ओआरएस की देखभाल",
        "summary_hi": "समय पर टीके, 6 महीने तक सिर्फ मां का दूध और डिहाइड्रेशन से बचाव।",
        "content_hi": "बच्चों को पोलियो, खसरा और निमोनिया से बचाने के लिए समय पर सभी टीके लगवाएं। पहले 6 महीने तक शिशु को केवल मां का दूध दें। दस्त या उल्टी होने पर तुरंत ओआरएस (ORS) का घोल दें और 14 दिनों तक जिंक की गोली खिलाएं जिससे शरीर में पानी की कमी न हो।",
        "key_takeaways_hi": [
            "सरकारी टीकाकरण कार्ड के अनुसार सभी टीके समय पर लगवाएं",
            "पहले 6 महीने सिर्फ मां का दूध पिलाएं",
            "दस्त होने पर हर बार ओआरएस (ORS) का घोल पिलाएं",
            "बच्चा सुस्त होने पर तुरंत डॉक्टर को दिखाएं"
        ],
        "title_mr": "लहान मुलांचे लसीकरण आणि जुलाब झाल्यास ओआरएस",
        "summary_mr": "मुलांचे वेळेवर लसीकरण, केवळ स्तनपान आणि डिहायड्रेशन प्रतिबंध.",
        "content_mr": "मुलांना पोलिओ, गोवर आणि इतर आजारांपासून वाचवण्यासाठी वेळेवर लसी द्या. पहिल्या ६ महिन्यांत फक्त आईचे दूध द्यावे. जुलाब झाल्यास बाळाला ओआरएस (ORS) चे पाणी आणि झिंकच्या गोळ्या द्याव्यात.",
        "key_takeaways_mr": [
            "वेळेवर सर्व लसीकरण पूर्ण करा",
            "पहिल्या ६ महिन्यांत फक्त आईचे दूध द्या",
            "जुलाब झाल्यास ओआरएस द्रावण द्या",
            "बाळ जास्त आजारी वाटल्यास तात्काळ दवाखान्यात न्या"
        ]
    },

    # ========================================================
    # 4. ELDERLY CARE INFORMATION
    # ========================================================
    {
        "slug": "elderly-fall-prevention-chronic-care",
        "category": "elderly_care",
        "icon": "FaUserNurse",
        "read_time_minutes": 3,
        "is_featured": True,
        "title": "Elderly Care: Fall Prevention & Chronic Medication Safety",
        "summary": "Home safety modifications, joint mobility exercises, and multi-medication organizing for seniors.",
        "content": "Elderly family members are vulnerable to accidental slip-and-fall injuries and medication confusion. Keep bathroom floors dry with anti-skid rubber mats, install wall grab bars, maintain night lighting in hallways, and arrange prescription pills into labeled morning/night boxes. Encourage light stretching and adequate calcium/Vitamin D intake for bone strength.",
        "key_takeaways": [
            "Install bathroom grab rails and keep floors dry to prevent hip fractures",
            "Use clear Morning & Night pill organizers to avoid double-dosing",
            "Get vision/cataract and hearing checkups annually",
            "Encourage 20 minutes of morning sunlight for Vitamin D bone health"
        ],
        "title_te": "వృద్ధుల సంరక్షణ: జారిపడకుండా జాగ్రత్తలు మరియు మందుల నిర్వహణ",
        "summary_te": "ఇంట్లో రక్షణ ఏర్పాట్లు, ఎముకల బలం మరియు రోజువారీ మందుల సమయాల పట్టిక.",
        "content_te": "వృద్ధులు బాత్రూంలో లేదా చీకటిలో జారిపడకుండా తగిన జాగ్రత్తలు తీసుకోవాలి. బాత్రూంలో పట్టుకోవడానికి హ్యాండిల్స్ ఏర్పాటు చేయాలి. రోజూ వేసుకునే బీపీ, షుగర్ మందులను ఉదయం, రాత్రి డబ్బాలలో వేరుగా ఉంచడం వల్ల మందులు మరచిపోకుండా ఉంటారు. ఎముకల బలం కోసం ఉదయం ఎండలో కూర్చోవాలి.",
        "key_takeaways_te": [
            "బాత్రూంలో జారకుండా రబ్బర్ మ్యాట్స్ మరియు హ్యాండిల్స్ అమర్చండి",
            "ఉదయం, రాత్రి మందులను విడివిడిగా డబ్బాలలో భద్రపరచండి",
            "కంటి చూపు మరియు వినికిడి పరీక్షలు క్రమం తప్పకుండా చేయించండి",
            "ఎముకల బలం కోసం ఉదయం 20 నిమిషాలు ఎండలో గడపండి"
        ],
        "title_hi": "बुजुर्गों की देखभाल: गिरने से बचाव और दवाओं का सही समय",
        "summary_hi": "घर में सुरक्षा के उपाय, हड्डियों की मजबूती और नियमित दवा प्रबंधन।",
        "content_hi": "बुजुर्गों में गिरने और फ्रैक्चर का खतरा अधिक होता है। बाथरूम में फिसलन न होने दें और दीवार पर पकड़ने के लिए हैंडल लगाएं। बीपी और शुगर की दवाओं को सुबह और रात के डिब्बे में अलग-अलग रखें ताकि दवा छूटे नहीं। हड्डियों की मजबूती के लिए सुबह की धूप लें।",
        "key_takeaways_hi": [
            "बाथरूम में एंटी-स्किड मैट और ग्रैब बार लगाएं",
            "दवाइयों को सुबह और रात के बॉक्स में अलग रखें",
            "सालाना आंखों (मोतियाबिंद) और कानों की जांच कराएं",
            "हड्डियों की मजबूती के लिए सुबह धूप में बैठें"
        ],
        "title_mr": "ज्येष्ठ नागरिकांची काळजी: घसरणे प्रतिबंध आणि औषध नियोजन",
        "summary_mr": "घरातील सुरक्षितता, हाडांची मजबुती आणि औषधांचे योग्य व्यवस्थापन.",
        "content_mr": "ज्येष्ठ व्यक्ती बाथरुममध्ये घसरणार नाहीत याची काळजी घ्या. बाथरुममध्ये हँडल्स लावा. रोजच्या गोळ्या सकाळी आणि रात्री अशा डब्यात वेगळ्या ठेवा. हाडे मजबूत राहण्यासाठी सकाळच्या कोवळ्या उन्हात बसावे.",
        "key_takeaways_mr": [
            "बाथरूममध्ये घसरणार नाही याची काळजी घ्या",
            "औषधे वेळेवर घेण्यासाठी गोळ्यांचा डबा वापरा",
            "डोळ्यांची आणि कानाची नियमित तपासणी करा",
            "हाडांच्या आरोग्यासाठी सकाळचे ऊन घ्या"
        ]
    }
]
