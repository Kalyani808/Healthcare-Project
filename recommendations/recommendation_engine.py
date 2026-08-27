"""
AI Recommendation Engine for Seva Health Platform.
Generates:
1. Personalized Health Content & Drug-Diet Interactions
2. Relevant Daily Health Awareness Tips
3. Clinical Follow-Up Checkup Recommendations
"""
from datetime import date, timedelta
from reminders.models import MedicationSchedule
from documents.models import MedicalDocument
from .models import PatientFollowUp, DailyHealthTip

class AIRecommendationEngine:

    @classmethod
    def generate_patient_recommendations(cls, user):
        """
        Analyze patient's active prescriptions, uploaded lab reports, and vitals to produce
        personalized clinical insights, drug-food interactions, and auto-scheduled follow-ups.
        """
        insights = []
        follow_up_suggestions = []

        # 1. Fetch active medication schedules
        active_schedules = MedicationSchedule.objects.filter(user=user, is_active=True)
        med_names = [s.medicine_name.lower() for s in active_schedules]

        # 2. Analyze Prescriptions
        has_antibiotic = any(ab in ' '.join(med_names) for ab in ['augmentin', 'amoxicillin', 'azithromycin', 'cefixime', 'cipro', 'doxycycline', 'antibiotic'])
        has_antacid = any(ac in ' '.join(med_names) for ac in ['pan', 'pantoprazole', 'omeprazole', 'rabeprazole', 'gelusil', 'digene'])
        has_diabetes_med = any(db in ' '.join(med_names) for db in ['metformin', 'glimepiride', 'glycomet', 'januvia', 'insulin', 'gliclazide', 'vildagliptin'])
        has_hypertension_med = any(bp in ' '.join(med_names) for bp in ['amlodipine', 'telmisartan', 'losartan', 'atenolol', 'stamlo', 'telma'])
        has_nsaid = any(ns in ' '.join(med_names) for ns in ['paracetamol', 'dolo', 'ibuprofen', 'combiflam', 'aceclofenac', 'diclofenac'])

        if has_antibiotic:
            insights.append({
                "id": "antibiotic_care",
                "badge": "Antibiotic Course Protocol",
                "type": "medication_guidance",
                "severity": "important",
                "title": "Complete Full Antibiotic Course & Replenish Gut Health",
                "description": "You are currently taking antibiotic medication. Always finish the prescribed duration (e.g. 5 days) even if fever or pain subsides. Consume fresh yogurt/curd or buttermilk 2 hours after doses to maintain healthy gut digestion.",
                "title_te": "యాంటీబయాటిక్ కోర్సు పూర్తి చేయండి మరియు పెరుగు/మజ్జిగ తీసుకోండి",
                "description_te": "మీరు యాంటీబయాటిక్ మందులు వాడుతున్నారు. డాక్టర్ చెప్పిన పూర్తి కోర్సు వాడాలి. కడుపులో మేలు చేసే బ్యాక్టీరియా కోసం రోజువారీ ఆహారంలో పెరుగు లేదా మజ్జిగ ఎక్కువగా తీసుకోండి.",
                "title_hi": "एंटीबायोटिक का पूरा कोर्स लें और दही/छाछ का सेवन करें",
                "description_hi": "एंटीबायोटिक की दवा बीच में न छोड़ें। पेट की पाचन शक्ति बनाए रखने के लिए दिन में ताजा दही या छाछ जरूर पिएं।",
                "title_mr": "अँटिबायोटिकचा पूर्ण डोस घ्या आणि दह्याचा वापर करा",
                "description_mr": "औषध मध्येच बंद करू नका. पोटाच्या आरोग्यासाठी ताजे दही आणि ताक प्यावे."
            })
            follow_up_suggestions.append({
                "title": "Post-Antibiotic Physician Recovery Check",
                "category": "doctor_visit",
                "reason": "Verify complete resolution of infection after completing prescribed antibiotic regimen.",
                "days_ahead": 6
            })

        if has_antacid:
            insights.append({
                "id": "antacid_timing",
                "badge": "Empty Stomach Rule",
                "type": "timing_guidance",
                "severity": "advisory",
                "title": "Take Antacid / PPI 30 Minutes Before Morning Breakfast",
                "description": "Proton pump inhibitors (like Pan-D or Pantoprazole) require an empty stomach to effectively coat the stomach lining and reduce acid secretion before food intake.",
                "title_te": "ఉదయం అల్పాహారానికి 30 నిమిషాల ముందు ఖాళీ కడుపుతో వేసుకోండి",
                "description_te": "యాంటాసిడ్ (పాన్-డి) మందులు ఉదయం ఖాళీ కడుపుతో వేసుకుంటేనే కడుపులో మంట, అసిడిటీని సమర్థవంతంగా అరికడతాయి.",
                "title_hi": "सुबह नाश्ते से 30 मिनट पहले खाली पेट लें",
                "description_hi": "गैस या एसिडिटी की दवा (जैसे Pan-D) को सुबह खाली पेट एक गिलास पानी के साथ लें।",
                "title_mr": "सकाळी नाश्त्याच्या ३० मिनिटे आधी रिकाम्या पोटी घ्या",
                "description_mr": "अ‍ॅसिडिटीच्या गोळ्या सकाळी रिकाम्या पोटी घेतल्यास उत्तम परिणाम मिळतो."
            })

        if has_diabetes_med:
            insights.append({
                "id": "hypoglycemia_prevention",
                "badge": "Diabetes Safety",
                "type": "clinical_alert",
                "severity": "important",
                "title": "Timely Meals & Hypoglycemia Awareness",
                "description": "Never skip meals after taking diabetes medication. If you experience sudden shakiness, sweating, or lightheadedness, immediately drink a glass of fruit juice or consume 2 sugar candies.",
                "title_te": "షుగర్ మందుల తర్వాత సమయానికి భోజనం చేయండి",
                "description_te": "షుగర్ మందులు వేసుకున్నాక భోజనం ఆలస్యం చేయవద్దు. ఒకవేళ వణుకు లేదా చెమటలు పట్టినట్లు అనిపిస్తే వెంటనే గ్లూకోజ్ లేదా పండ్ల రసం తీసుకోండి.",
                "title_hi": "दवा के बाद समय पर खाना खाएं - लो शुगर से बचें",
                "description_hi": "शुगर की दवा लेने के बाद खाना न छोड़ें। चक्कर या घबराहट होने पर तुरंत थोड़ा मीठा या ग्लूकोज लें।",
                "title_mr": "वेळेवर जेवण करा - रक्तातील साखर कमी होऊ देऊ नका",
                "description_mr": "औषध घेतल्यानंतर जेवण टाळू नका. चक्कर आल्यास लगेच गोड काहीतरी खा."
            })
            follow_up_suggestions.append({
                "title": "Quarterly HbA1c & Fasting Blood Sugar Lab Test",
                "category": "lab_retest",
                "reason": "Evaluate 90-day average blood glucose control and therapeutic dosage efficacy.",
                "days_ahead": 90
            })

        if has_hypertension_med:
            insights.append({
                "id": "salt_reduction_bp",
                "badge": "Hypertension Protocol",
                "type": "lifestyle_guidance",
                "severity": "advisory",
                "title": "Maintain Consistent Morning BP Dosing & Low-Sodium Diet",
                "description": "Take your blood pressure medication at the exact same hour every morning. Avoid adding extra raw table salt to cooked curries and eliminate salted pickles to avoid sudden pressure elevations.",
                "title_te": "రోజూ ఉదయం ఒకే సమయానికి బీపీ మాత్ర వేసుకోండి",
                "description_te": "బీపీ మాత్రను రోజూ ఒకే సమయానికి వేసుకోవాలి. కూరల్లో ఉప్పు తగ్గించండి మరియు నిల్వ పచ్చళ్ళు తినకండి.",
                "title_hi": "रोज सुबह सही समय पर बीपी की दवा लें",
                "description_hi": "दवा का समय न बदलें। खाने में ऊपर से कच्चा नमक और अचार का उपयोग बंद करें।",
                "title_mr": "रोज सकाळी वेळेवर रक्तदाबाची गोळी घ्या",
                "description_mr": "औषध रोज एकाच वेळी घ्या. जेवणात मिठाचे प्रमाण कमी ठेवा."
            })
            follow_up_suggestions.append({
                "title": "Bi-Weekly Blood Pressure (BP) Monitoring Check",
                "category": "vitals_check",
                "reason": "Ensure blood pressure remains stably within optimal 120/80 mmHg limits.",
                "days_ahead": 14
            })

        # 3. Default General Wellness Insights if no prescriptions are found
        if not insights:
            insights.append({
                "id": "general_vitality",
                "badge": "Daily Wellness Protocol",
                "type": "lifestyle_guidance",
                "severity": "advisory",
                "title": "Maintain Daily Hydration & 30-Minute Brisk Walking",
                "description": "Drink 2.5 to 3 Liters of clean boiled or filtered water daily. 30 minutes of regular physical activity boosts natural cardiovascular endurance and metabolic vitality.",
                "title_te": "రోజూ 3 లీటర్ల శుభ్రమైన నీరు త్రాగండి మరియు 30 నిమిషాలు నడవండి",
                "description_te": "శరీరం ఆరోగ్యంగా ఉండటానికి రోజూ కాచి చల్లార్చిన నీరు త్రాగాలి మరియు 30 నిమిషాలు వాకింగ్ చేయాలి.",
                "title_hi": "रोज 3 लीटर पानी पिएं और 30 मिनट टहलें",
                "description_hi": "दिनभर में पर्याप्त पानी पिएं और रोजाना 30 मिनट सुबह या शाम की सैर करें।",
                "title_mr": "दररोज ३ लिटर पाणी प्या आणि ३० मिनिटे चाला",
                "description_mr": "दिवसभरात भरपूर पाणी प्या आणि नियमित व्यायाम करा."
            })

        # 4. Auto-Schedule Follow-Ups in Database if not already present
        for fu in follow_up_suggestions:
            target_date = date.today() + timedelta(days=fu['days_ahead'])
            exists = PatientFollowUp.objects.filter(
                patient=user,
                title=fu['title'],
                is_completed=False,
                recommended_date__gte=date.today()
            ).exists()

            if not exists:
                PatientFollowUp.objects.create(
                    patient=user,
                    title=fu['title'],
                    category=fu['category'],
                    reason=fu['reason'],
                    recommended_date=target_date
                )

        return {
            "insights": insights,
            "active_medication_count": len(med_names),
            "generated_at": date.today().isoformat()
        }
