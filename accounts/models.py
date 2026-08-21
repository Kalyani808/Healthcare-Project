from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('patient', 'Patient'),
        ('healthcare_worker', 'Healthcare Worker'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class LanguagePreference(models.Model):
    LANGUAGE_CHOICES = (
        ('hi', 'Hindi'),
        ('mr', 'Marathi'),
        ('ta', 'Tamil'),
        ('te', 'Telugu'),
        ('bn', 'Bengali'),
        ('gu', 'Gujarati'),
        ('kn', 'Kannada'),
        ('en', 'English'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='language_preference')
    preferred_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    voice_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.preferred_language}"


class PatientProfile(models.Model):
    GENDER_CHOICES = (('M', 'Male'), ('F', 'Female'), ('O', 'Other'))

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    address = models.TextField(blank=True)
    village_town = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_number = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"Patient: {self.user.username}"


class HealthcareWorkerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='healthcare_worker_profile')
    specialization = models.CharField(max_length=100, blank=True)
    registration_number = models.CharField(max_length=50, blank=True)
    facility_name = models.CharField(max_length=150, blank=True)
    facility_address = models.TextField(blank=True)
    years_of_experience = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"HCW: {self.user.username} ({self.facility_name})"