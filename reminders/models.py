from django.db import models
from django.conf import settings
from django.utils import timezone
import datetime

class MedicationSchedule(models.Model):
    FOOD_TIMING_CHOICES = [
        ('before_meal', 'Before Food'),
        ('after_meal', 'After Food'),
        ('with_meal', 'With Food'),
        ('anytime', 'Anytime / As Directed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='medication_schedules')
    medicine_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. 500mg, 1 tablet")
    frequency = models.CharField(max_length=100, default='1-0-1', help_text="e.g. 1-0-1, OD, BD, TDS")
    
    # 3-Slot Daily Scheduling Flags & Times
    is_morning = models.BooleanField(default=True)
    morning_time = models.TimeField(default=datetime.time(8, 0))
    
    is_afternoon = models.BooleanField(default=False)
    afternoon_time = models.TimeField(default=datetime.time(13, 0))
    
    is_night = models.BooleanField(default=True)
    night_time = models.TimeField(default=datetime.time(20, 0))
    
    food_timing = models.CharField(max_length=50, choices=FOOD_TIMING_CHOICES, default='after_meal')
    duration_days = models.IntegerField(default=5, help_text="Duration in days")
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(blank=True, null=True)
    
    category = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Antibiotic, Pain Relief")
    usage_summary = models.TextField(blank=True, null=True, help_text="Clinical usage / indication")
    instructions = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Optional link to source prescription document
    source_document = models.ForeignKey('documents.MedicalDocument', on_delete=models.SET_NULL, null=True, blank=True, related_name='schedules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.end_date and self.duration_days and self.start_date:
            self.end_date = self.start_date + datetime.timedelta(days=self.duration_days)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.medicine_name} ({self.dosage}) - {self.user.username}"


class MedicationLog(models.Model):
    SLOT_CHOICES = [
        ('morning', 'Morning (8:00 AM)'),
        ('afternoon', 'Afternoon (1:00 PM)'),
        ('night', 'Night (8:00 PM)'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('taken', 'Taken'),
        ('missed', 'Missed'),
        ('skipped', 'Skipped / Snoozed'),
    ]

    schedule = models.ForeignKey(MedicationSchedule, on_delete=models.CASCADE, related_name='logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='medication_logs')
    date = models.DateField(default=timezone.now)
    slot = models.CharField(max_length=20, choices=SLOT_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_time = models.TimeField(null=True, blank=True)
    taken_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('schedule', 'date', 'slot')

    def __str__(self):
        return f"{self.schedule.medicine_name} [{self.slot.upper()}] - {self.date} ({self.status})"


class CaregiverContact(models.Model):
    RELATIONSHIP_CHOICES = [
        ('family', 'Family Member / Spouse'),
        ('child', 'Son / Daughter'),
        ('parent', 'Parent'),
        ('nurse', 'Nurse / Attendant'),
        ('friend', 'Friend / Neighbor'),
        ('other', 'Other Caregiver'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='caregivers')
    name = models.CharField(max_length=150)
    relationship = models.CharField(max_length=50, choices=RELATIONSHIP_CHOICES, default='family')
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    notify_on_missed = models.BooleanField(default=True, help_text="Send alert if medication is missed for 2+ hours")
    notify_on_emergency = models.BooleanField(default=True, help_text="Notify immediately during Emergency SOS")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.relationship}) -> {self.user.username}"
