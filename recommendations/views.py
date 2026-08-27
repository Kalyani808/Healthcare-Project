from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.utils import timezone
from .models import PatientFollowUp, DailyHealthTip
from .serializers import PatientFollowUpSerializer, DailyHealthTipSerializer
from .recommendation_engine import AIRecommendationEngine

DEFAULT_HEALTH_TIPS = [
    {
        "category": "hydration",
        "tip_text": "Always drink clean, boiled water during monsoon season to protect your family from typhoid and waterborne infections.",
        "tip_text_te": "వర్షాకాలంలో టైఫాయిడ్ మరియు ఇతర వ్యాధులు రాకుండా ఉండటానికి కాచి చల్లార్చిన నీటిని మాత్రమే త్రాగండి.",
        "tip_text_hi": "बरसात के मौसम में पानी को उबालकर और छानकर ही पिएं ताकि टाइफाइड और पेट की बीमारियों से बचाव हो सके।",
        "tip_text_mr": "पावसाळ्यात टायफॉइड आणि पोटाचे आजार टाळण्यासाठी नेहमी पाणी उकळून प्या.",
        "author_badge": "Monsoon Safety Directive"
    },
    {
        "category": "hypertension",
        "tip_text": "Cut down on pickle and processed snack consumption. Reducing dietary sodium keeps heart and blood pressure stable.",
        "tip_text_te": "నిల్వ పచ్చళ్ళు మరియు ఉప్పు ఎక్కువగా ఉండే పదార్థాలు తగ్గించండి. ఉప్పు తక్కువగా తీసుకోవడం వల్ల గుండె మరియు బీపీ ఆరోగ్యంగా ఉంటాయి.",
        "tip_text_hi": "अचार और नमकीन स्नैक्स कम खाएं। नमक कम करने से ब्लड प्रेशर और दिल दोनों स्वस्थ रहते हैं।",
        "tip_text_mr": "लोणचे आणि खारट पदार्थ कमी खा. मिठाचे प्रमाण कमी ठेवल्यास रक्तदाब नियंत्रणात राहतो.",
        "author_badge": "Cardio Health Tip"
    },
    {
        "category": "diabetes",
        "tip_text": "Include millets like Ragi and Jowar in your daily meals instead of polished white rice to avoid sudden blood sugar spikes.",
        "tip_text_te": "తెల్ల అన్నం బదులు రాగులు, జొన్న రొట్టెలు ఆహారంలో చేర్చుకోండి. ఇవి రక్తంలో చక్కెర స్థాయిని అదుపులో ఉంచుతాయి.",
        "tip_text_hi": "सफेद चावल की जगह रागी और ज्वार की रोटी खाएं। इससे खाने के बाद शुगर अचानक नहीं बढ़ती।",
        "tip_text_mr": "पांढऱ्या तांदळाऐवजी नाचणी आणि ज्वारीची भाकरी खा. यामुळे रक्तातील साखर वाढत नाही.",
        "author_badge": "Diabetes Nutrition"
    },
    {
        "category": "nutrition",
        "tip_text": "Eat a small portion of jaggery with roasted chana (Bengal gram) daily to naturally boost hemoglobin and fight fatigue.",
        "tip_text_te": "రక్తహీనత తగ్గడానికి మరియు హిమోగ్లోబిన్ పెరగడానికి రోజూ కొద్దిగా బెల్లం మరియు వేయించిన శనగలు తీసుకోండి.",
        "tip_text_hi": "रोजाना थोड़ा गुड़ और भुना चना खाएं। इससे खून में हीमोग्लोबिन बढ़ता है और कमजोरी दूर होती है।",
        "tip_text_mr": "गूळ आणि भाजलेले हरभरे रोज खाल्ल्यास शरीरातील रक्ताचे प्रमाण वाढते आणि अशक्तपणा दूर होतो.",
        "author_badge": "Anemia Prevention"
    }
]

def ensure_health_tips_seeded():
    if DailyHealthTip.objects.count() == 0:
        for t in DEFAULT_HEALTH_TIPS:
            DailyHealthTip.objects.create(**t)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_recommendations(request):
    """Returns patient-tailored clinical guidance based on active prescriptions and lab tests."""
    data = AIRecommendationEngine.generate_patient_recommendations(request.user)
    return Response(data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_daily_health_tips(request):
    """Returns curated daily health awareness tips in 4 Indian languages."""
    ensure_health_tips_seeded()
    tips = DailyHealthTip.objects.filter(is_active=True).order_by('?')[:4]
    serializer = DailyHealthTipSerializer(tips, many=True)
    return Response({"tips": serializer.data})

class PatientFollowUpViewSet(viewsets.ModelViewSet):
    serializer_class = PatientFollowUpSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PatientFollowUp.objects.filter(patient=self.request.user).order_by('is_completed', 'recommended_date')

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        follow_up = self.get_object()
        follow_up.is_completed = True
        follow_up.completed_at = timezone.now()
        follow_up.save()
        return Response(self.get_serializer(follow_up).data)
