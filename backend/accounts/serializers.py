from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Patient, Doctor
from .models import Patient, Doctor, MedicalDocument


class UserSerializer(serializers.ModelSerializer):

    # Patient fields
    phone = serializers.CharField(write_only=True)
    date_of_birth = serializers.DateField(write_only=True)
    gender = serializers.CharField(write_only=True)
    language_preference = serializers.CharField(write_only=True)
    emergency_contact = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'password',
            'first_name',
            'last_name',
            'email',

            'phone',
            'date_of_birth',
            'gender',
            'language_preference',
            'emergency_contact',
        ]

        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):

        # Remove patient data
        phone = validated_data.pop('phone')
        date_of_birth = validated_data.pop('date_of_birth')
        gender = validated_data.pop('gender')
        language_preference = validated_data.pop('language_preference')
        emergency_contact = validated_data.pop('emergency_contact')

        # Create User
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )

        # Create Patient automatically
        Patient.objects.create(
            user=user,
            phone=phone,
            date_of_birth=date_of_birth,
            gender=gender,
            language_preference=language_preference,
            emergency_contact=emergency_contact
        )

        return user


class PatientSerializer(serializers.ModelSerializer):

    class Meta:
        model = Patient
        fields = '__all__'


class DoctorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Doctor
        fields = '__all__'
class MedicalDocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = MedicalDocument
        fields = "__all__"        