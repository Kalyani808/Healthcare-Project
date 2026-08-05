from django.db import models
from django.contrib.auth.models import User


class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    phone = models.CharField(max_length=15)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10)
    language_preference = models.CharField(max_length=50)
    emergency_contact = models.CharField(max_length=15)

    def __str__(self):
        return self.user.get_full_name()


class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    full_name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100)
    experience = models.PositiveIntegerField()
    qualification = models.CharField(max_length=100)

    phone = models.CharField(max_length=15)
    consultation_fee = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return self.full_name


class MedicalDocument(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)

    document_name = models.CharField(max_length=200)
    document_type = models.CharField(max_length=50)
    file = models.ImageField(upload_to="medical_documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.document_name
    