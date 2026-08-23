from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmergencyContactViewSet, EmergencyFacilityViewSet

router = DefaultRouter()
router.register(r'contacts', EmergencyContactViewSet, basename='emergency-contact')
router.register(r'facilities', EmergencyFacilityViewSet, basename='emergency-facility')

urlpatterns = [
    path('', include(router.urls)),
]
