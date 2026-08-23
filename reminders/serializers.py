from rest_framework import serializers
from .models import MedicationSchedule, MedicationLog, CaregiverContact

class MedicationLogSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='schedule.medicine_name', read_only=True)
    dosage = serializers.CharField(source='schedule.dosage', read_only=True)
    food_timing = serializers.CharField(source='schedule.food_timing', read_only=True)
    usage_summary = serializers.CharField(source='schedule.usage_summary', read_only=True)

    class Meta:
        model = MedicationLog
        fields = ['id', 'schedule', 'medicine_name', 'dosage', 'food_timing', 'usage_summary', 'date', 'slot', 'status', 'scheduled_time', 'taken_at', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class MedicationScheduleSerializer(serializers.ModelSerializer):
    logs = MedicationLogSerializer(many=True, read_only=True)

    class Meta:
        model = MedicationSchedule
        fields = [
            'id', 'user', 'medicine_name', 'dosage', 'frequency',
            'is_morning', 'morning_time', 'is_afternoon', 'afternoon_time', 'is_night', 'night_time',
            'food_timing', 'duration_days', 'start_date', 'end_date',
            'category', 'usage_summary', 'instructions', 'is_active',
            'source_document', 'created_at', 'updated_at', 'logs'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class CaregiverContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaregiverContact
        fields = ['id', 'user', 'name', 'relationship', 'phone_number', 'email', 'notify_on_missed', 'notify_on_emergency', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
