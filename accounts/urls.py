from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ProfileView, UserView, LanguagePreferenceView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='login_refresh'),
    path('user/', UserView.as_view(), name='user_detail'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/language/', LanguagePreferenceView.as_view(), name='language_preference'),
]
