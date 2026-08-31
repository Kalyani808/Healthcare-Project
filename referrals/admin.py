from django.contrib import admin
from .models import HealthcareProvider, DoctorReferral


@admin.register(HealthcareProvider)
class HealthcareProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'specialization', 'qualification', 'hospital_name', 'city', 'verification_status', 'availability_status', 'phone_number']
    list_filter = ['verification_status', 'availability_status', 'consultation_type', 'city', 'specialization']
    search_fields = ['name', 'specialization', 'hospital_name', 'city', 'registration_number']


@admin.register(DoctorReferral)
class DoctorReferralAdmin(admin.ModelAdmin):
    list_display = ['patient', 'referring_doctor_name', 'referring_facility', 'specialty', 'referred_provider', 'status', 'created_at']
    list_filter = ['status', 'specialty']
    search_fields = ['patient__email', 'referring_doctor_name', 'specialty']
