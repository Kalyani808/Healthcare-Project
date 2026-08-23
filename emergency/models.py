from django.db import models
from django.conf import settings

class EmergencyContact(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='emergency_contacts')
    name = models.CharField(max_length=150)
    relationship = models.CharField(max_length=100, help_text="e.g. Spouse, Brother, Doctor, Neighbor")
    phone_number = models.CharField(max_length=20)
    is_primary = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.relationship}) - {self.phone_number}"


class EmergencyFacility(models.Model):
    FACILITY_TYPE_CHOICES = [
        ('hospital', 'Hospital & Trauma Center'),
        ('emergency_room', '24/7 Emergency Room'),
        ('pharmacy', '24/7 Pharmacy'),
        ('blood_bank', 'Blood Bank'),
        ('cardiac_center', 'Cardiac Emergency Center'),
        ('burn_unit', 'Burn Center'),
    ]

    name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=50, choices=FACILITY_TYPE_CHOICES, default='hospital')
    address = models.TextField()
    city = models.CharField(max_length=100, default='Hyderabad')
    state = models.CharField(max_length=100, default='Telangana')
    pincode = models.CharField(max_length=20, blank=True, null=True)
    
    phone_number = models.CharField(max_length=30)
    emergency_hotline = models.CharField(max_length=30, blank=True, null=True)
    ambulance_phone = models.CharField(max_length=30, default='108')
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    is_24_hours = models.BooleanField(default=True)
    has_icu = models.BooleanField(default=True)
    has_blood_bank = models.BooleanField(default=True)
    available_services = models.TextField(blank=True, null=True, help_text="e.g. Trauma Care, Cardiac ICU, CT Scan")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.city}) - {self.phone_number}"
