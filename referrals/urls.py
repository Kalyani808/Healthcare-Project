from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthcareProviderViewSet, DoctorReferralViewSet

router = DefaultRouter()
router.register(r'providers', HealthcareProviderViewSet, basename='provider')
router.register(r'referrals', DoctorReferralViewSet, basename='referral')

urlpatterns = [
    path('', include(router.urls)),
]
