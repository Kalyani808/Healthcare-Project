from rest_framework import serializers
from .models import EmergencyContact, EmergencyFacility

class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ['id', 'user', 'name', 'relationship', 'phone_number', 'is_primary', 'notes', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class EmergencyFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyFacility
        fields = [
            'id', 'name', 'facility_type', 'address', 'city', 'state', 'pincode',
            'phone_number', 'emergency_hotline', 'ambulance_phone',
            'latitude', 'longitude', 'is_24_hours', 'has_icu', 'has_blood_bank',
            'available_services', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
