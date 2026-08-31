import math
from rest_framework import serializers
from .models import HealthcareProvider, DoctorReferral


def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate Haversine distance in kilometers between two geographic coordinates.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    try:
        R = 6371.0  # Earth's radius in kilometers
        dlat = math.radians(float(lat2) - float(lat1))
        dlon = math.radians(float(lon2) - float(lon1))
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except (ValueError, TypeError):
        return None


class HealthcareProviderSerializer(serializers.ModelSerializer):
    distance = serializers.SerializerMethodField()
    distance_formatted = serializers.SerializerMethodField()
    verification_label = serializers.SerializerMethodField()

    class Meta:
        model = HealthcareProvider
        fields = [
            'id',
            'name',
            'specialization',
            'qualification',
            'experience_years',
            'hospital_name',
            'address',
            'city',
            'state',
            'pincode',
            'phone_number',
            'registration_number',
            'verification_status',
            'verification_label',
            'availability_status',
            'consultation_type',
            'latitude',
            'longitude',
            'profile_description',
            'distance',
            'distance_formatted',
            'created_at',
            'updated_at',
        ]

    def get_distance(self, obj):
        user_lat = self.context.get('user_lat')
        user_lon = self.context.get('user_lon')
        if user_lat is not None and user_lon is not None:
            dist = calculate_haversine_distance(user_lat, user_lon, obj.latitude, obj.longitude)
            return round(dist, 2) if dist is not None else None
        return None

    def get_distance_formatted(self, obj):
        dist = self.get_distance(obj)
        if dist is not None:
            return f"{dist} km away"
        return None

    def get_verification_label(self, obj):
        if obj.verification_status == 'verified':
            return "Verified in SevaHealth Provider Directory"
        elif obj.verification_status == 'pending':
            return "Pending Verification"
        return "Currently Unavailable"


class DoctorReferralSerializer(serializers.ModelSerializer):
    referred_provider_detail = HealthcareProviderSerializer(source='referred_provider', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    verified_alternatives = serializers.SerializerMethodField()

    class Meta:
        model = DoctorReferral
        fields = [
            'id',
            'patient',
            'patient_name',
            'referring_doctor_name',
            'referring_facility',
            'referred_provider',
            'referred_provider_detail',
            'suggested_doctor_name',
            'specialty',
            'reason',
            'notes',
            'status',
            'verified_alternatives',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'patient', 'created_at', 'updated_at']

    def get_verified_alternatives(self, obj):
        """
        Returns top verified specialists in the same field to provide transparent second opinions.
        """
        if not obj.specialty:
            return []
        providers = HealthcareProvider.objects.filter(
            specialization__icontains=obj.specialty,
            verification_status='verified'
        ).order_by('-experience_years')[:3]
        return HealthcareProviderSerializer(providers, many=True, context=self.context).data
