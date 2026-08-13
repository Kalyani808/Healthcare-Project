from rest_framework.routers import DefaultRouter
from .views import MedicalDocumentViewSet

router = DefaultRouter()
router.register(r'', MedicalDocumentViewSet, basename='medicaldocument')

urlpatterns = router.urls