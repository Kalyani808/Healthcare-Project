from django.db import models
from django.conf import settings


class HealthcareProvider(models.Model):
    VERIFICATION_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified Provider Directory'),
        ('unavailable', 'Currently Unavailable'),
    ]

    AVAILABILITY_CHOICES = [
        ('available', 'Available Today'),
        ('limited', 'Limited Slots'),
        ('unavailable', 'Unavailable'),
    ]

    CONSULTATION_CHOICES = [
        ('in_person', 'In-Person Consultation'),
        ('teleconsultation', 'Teleconsultation Only'),
        ('both', 'In-Person & Teleconsultation'),
    ]

    name = models.CharField(max_length=255, help_text="Full Doctor / Specialist Name")
    specialization = models.CharField(max_length=150, db_index=True, help_text="e.g. Cardiology, Neurology, Orthopedics")
    qualification = models.CharField(max_length=200, help_text="e.g. MBBS, MD (General Medicine), DM (Cardiology)")
    experience_years = models.PositiveIntegerField(default=5, help_text="Years of clinical practice")
    hospital_name = models.CharField(max_length=255, help_text="Hospital / Medical Institute Affiliation")
    address = models.TextField(help_text="Clinical Address")
    city = models.CharField(max_length=100, db_index=True, default="Hyderabad")
    state = models.CharField(max_length=100, default="Telangana")
    pincode = models.CharField(max_length=20, blank=True, default="")
    phone_number = models.CharField(max_length=50, help_text="Hospital Consultation Helpline")
    registration_number = models.CharField(max_length=100, blank=True, default="", help_text="State Medical Council Reg. No.")
    
    verification_status = models.CharField(
        max_length=30,
        choices=VERIFICATION_CHOICES,
        default='verified',
        db_index=True,
        help_text="Verification in SevaHealth Provider Directory"
    )
    availability_status = models.CharField(
        max_length=30,
        choices=AVAILABILITY_CHOICES,
        default='available',
        db_index=True
    )
    consultation_type = models.CharField(
        max_length=30,
        choices=CONSULTATION_CHOICES,
        default='both'
    )
    
    latitude = models.FloatField(null=True, blank=True, help_text="GPS Latitude coordinate")
    longitude = models.FloatField(null=True, blank=True, help_text="GPS Longitude coordinate")
    profile_description = models.TextField(blank=True, default="")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-experience_years', 'name']
        verbose_name = "Healthcare Provider"
        verbose_name_plural = "Healthcare Providers"

    def __str__(self):
        return f"Dr. {self.name} - {self.specialization} ({self.hospital_name}, {self.city})"


class DoctorReferral(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active Referral'),
        ('completed', 'Completed Consultation'),
        ('cancelled', 'Cancelled / Expired'),
    ]

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_referrals',
        help_text="Patient receiving referral"
    )
    referring_doctor_name = models.CharField(max_length=255, help_text="Name of rural / local doctor who initiated referral")
    referring_facility = models.CharField(max_length=255, help_text="Local Clinic / Primary Health Center (PHC)")
    referred_provider = models.ForeignKey(
        HealthcareProvider,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_referrals',
        help_text="Recommended specialist doctor from verified directory"
    )
    suggested_doctor_name = models.CharField(max_length=255, blank=True, default="", help_text="Name of urban doctor suggested by rural clinic, if any")
    specialty = models.CharField(max_length=150, help_text="Specialty required e.g. Cardiology")
    reason = models.TextField(help_text="Medical reason for referral")
    notes = models.TextField(blank=True, default="", help_text="Additional clinical notes or diagnosis")
    
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Doctor Referral"
        verbose_name_plural = "Doctor Referrals"

    def __str__(self):
        return f"Referral for {self.patient} to {self.referred_provider or self.specialty} by Dr. {self.referring_doctor_name}"
