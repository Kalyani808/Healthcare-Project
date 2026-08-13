from rest_framework import serializers
from .models import MedicalDocument


class MedicalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalDocument
        fields = ['id', 'user', 'document_name', 'document_type', 'file', 'status', 'uploaded_at']
        read_only_fields = ['user', 'status', 'uploaded_at']