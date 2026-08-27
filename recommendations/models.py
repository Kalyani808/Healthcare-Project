from django.db import models
from django.conf import settings

class PatientFollowUp(models.Model):
    CATEGORY_CHOICES = (
        ('doctor_visit', 'Doctor Consultation Follow-Up'),
        ('lab_retest', 'Diagnostic Lab Re-Test'),
        ('vitals_check', 'Vitals & BP Monitoring'),
        ('medication_review', 'Medication Refill & Review'),
    )

    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='follow_ups')
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='doctor_visit')
    reason = models.TextField()
    recommended_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Follow-up: {self.title} for {self.patient.username} on {self.recommended_date}"


class DailyHealthTip(models.Model):
    CATEGORY_CHOICES = (
        ('nutrition', 'Diet & Nutrition'),
        ('hydration', 'Hydration & Water Safety'),
        ('hypertension', 'Blood Pressure Management'),
        ('diabetes', 'Sugar Management'),
        ('general', 'Daily Vitality'),
    )

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    tip_text = models.CharField(max_length=500)
    tip_text_te = models.CharField(max_length=500, blank=True)
    tip_text_hi = models.CharField(max_length=500, blank=True)
    tip_text_mr = models.CharField(max_length=500, blank=True)
    author_badge = models.CharField(max_length=100, default='Clinical AI Sahayak')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"[{self.category}] {self.tip_text[:50]}..."
