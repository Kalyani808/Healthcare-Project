from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from documents.views import MedicalDocumentViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/voice/transcribe/', MedicalDocumentViewSet.as_view({'post': 'transcribe_voice'})),
    path('api/chat/', MedicalDocumentViewSet.as_view({'post': 'ai_chat'})),
    path('api/documents/', include('documents.urls')),
    path('api/reminders/', include('reminders.urls')),
    path('api/emergency/', include('emergency.urls')),
    path('api/education/', include('education.urls')),
    path('api/recommendations/', include('recommendations.urls')),
    path('api/vision-ai/', include('vision_ai.urls')),
    path('api/auth/', include('accounts.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)