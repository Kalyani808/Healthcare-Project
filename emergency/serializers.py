from rest_framework import serializers
from .models import EmergencyContact, EmergencyFacility

class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ['id', 'user', 'name', 'relationship', 'phone_number', 'is_primary', 'notes', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class EmergencyFacilitySerializer(serializers.ModelSerializer):
    distance = serializers.SerializerMethodField()
    distance_formatted = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyFacility
        fields = [
            'id', 'name', 'facility_type', 'address', 'city', 'state', 'pincode',
            'phone_number', 'emergency_hotline', 'ambulance_phone',
            'latitude', 'longitude', 'is_24_hours', 'has_icu', 'has_blood_bank',
            'available_services', 'created_at', 'distance', 'distance_formatted'
        ]
        read_only_fields = ['id', 'created_at']

    def get_distance(self, obj):
        dist = getattr(obj, 'calculated_distance', None)
        if dist is not None and dist != float('inf'):
            return round(dist, 2)
        return None

    def get_distance_formatted(self, obj):
        dist = getattr(obj, 'calculated_distance', None)
        if dist is not None and dist != float('inf'):
            if dist < 1.0:
                meters = int(round(dist * 1000))
                return f"{meters} m"
            return f"{round(dist, 1)} km"
        return None
