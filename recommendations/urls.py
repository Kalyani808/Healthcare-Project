from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_my_recommendations, get_daily_health_tips, PatientFollowUpViewSet

router = DefaultRouter()
router.register(r'follow-ups', PatientFollowUpViewSet, basename='patient-follow-ups')

urlpatterns = [
    path('my-recommendations/', get_my_recommendations, name='my-recommendations'),
    path('daily-tips/', get_daily_health_tips, name='daily-health-tips'),
    path('', include(router.urls)),
]
