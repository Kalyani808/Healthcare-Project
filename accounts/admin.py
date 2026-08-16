from django.contrib import admin
from .models import User, LanguagePreference, PatientProfile, HealthcareWorkerProfile

admin.site.register(User)
admin.site.register(LanguagePreference)
admin.site.register(PatientProfile)
admin.site.register(HealthcareWorkerProfile)