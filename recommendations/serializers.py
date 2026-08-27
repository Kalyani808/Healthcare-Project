from rest_framework import serializers
from .models import PatientFollowUp, DailyHealthTip

class PatientFollowUpSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = PatientFollowUp
        fields = [
            'id',
            'title',
            'category',
            'category_display',
            'reason',
            'recommended_date',
            'is_completed',
            'completed_at',
            'created_at',
        ]


class DailyHealthTipSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyHealthTip
        fields = [
            'id',
            'category',
            'tip_text',
            'tip_text_te',
            'tip_text_hi',
            'tip_text_mr',
            'author_badge',
            'is_active',
        ]
