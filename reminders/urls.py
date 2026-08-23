from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicationScheduleViewSet, CaregiverContactViewSet

router = DefaultRouter()
router.register(r'schedules', MedicationScheduleViewSet, basename='medication-schedule')
router.register(r'caregivers', CaregiverContactViewSet, basename='caregiver-contact')

urlpatterns = [
    path('', include(router.urls)),
]
