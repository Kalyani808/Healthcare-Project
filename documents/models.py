from django.db import models
from accounts.models import User
from django.core.exceptions import ValidationError
import os


def validate_image_file(value):
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.jpg', '.jpeg', '.png']
    if ext not in valid_extensions:
        raise ValidationError('Only image files (.jpg, .jpeg, .png) are allowed.')

class MedicalDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = (
        ('image', 'Image'),
        # future: ('pdf', 'PDF'), ('word', 'Word Document')
    )

    STATUS_CHOICES = (
        ('uploaded', 'Uploaded'),
        ('processing', 'Processing'),
        ('translated', 'Translated'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medical_documents')
    document_name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default='image')
    file = models.FileField(upload_to='medical_documents/%Y/%m/', validators=[validate_image_file])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    extracted_text = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document_name} - {self.user.username}"