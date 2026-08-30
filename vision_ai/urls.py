from django.urls import path
from .views import SkinConditionAnalyzerView, PillIdentifierView, SyncPillToReminderView

app_name = 'vision_ai'

urlpatterns = [
    path('analyze-skin/', SkinConditionAnalyzerView.as_view(), name='analyze_skin'),
    path('identify-pill/', PillIdentifierView.as_view(), name='identify_pill'),
    path('sync-pill-reminder/', SyncPillToReminderView.as_view(), name='sync_pill_reminder'),
]
