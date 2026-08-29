from rest_framework import serializers
from .models import User, LanguagePreference, PatientProfile, HealthcareWorkerProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'role')
        read_only_fields = ('id', 'role')


class PatientProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)
    phone_number = serializers.CharField(source='user.phone_number', required=False, allow_blank=True)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    full_name = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)

    def get_full_name(self, obj):
        fname = (obj.user.first_name or '').strip()
        lname = (obj.user.last_name or '').strip()
        if fname or lname:
            return f"{fname} {lname}".strip()
        return obj.user.username.capitalize() if obj.user.username else "Patient"

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'user', 'username', 'email', 'phone_number', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'gender', 'address', 'village_town',
            'district', 'state', 'emergency_contact_name', 'emergency_contact_number'
        ]
        read_only_fields = ('id', 'user')

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        if 'email' in user_data:
            user.email = user_data['email']
        if 'phone_number' in user_data:
            user.phone_number = user_data['phone_number']
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        user.save()

        return super().update(instance, validated_data)


class HealthcareWorkerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)
    phone_number = serializers.CharField(source='user.phone_number', required=False, allow_blank=True)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = HealthcareWorkerProfile
        fields = [
            'id', 'user', 'username', 'email', 'phone_number', 'first_name',
            'specialization', 'registration_number', 'facility_name',
            'facility_address', 'years_of_experience'
        ]
        read_only_fields = ('id', 'user')

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        if 'email' in user_data:
            user.email = user_data['email']
        if 'phone_number' in user_data:
            user.phone_number = user_data['phone_number']
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        user.save()

        return super().update(instance, validated_data)


class LanguagePreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LanguagePreference
        fields = '__all__'
        read_only_fields = ('user',)

        
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'phone_number')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data['role'],
            phone_number=validated_data.get('phone_number', ''),
        )
        LanguagePreference.objects.create(user=user)
        if user.role == 'patient':
            PatientProfile.objects.create(user=user)
        elif user.role == 'healthcare_worker':
            HealthcareWorkerProfile.objects.create(user=user)
        return user