from rest_framework import serializers
from .models import HealthEducationArticle

class HealthEducationArticleSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = HealthEducationArticle
        fields = [
            'id',
            'slug',
            'category',
            'category_display',
            'icon',
            'read_time_minutes',
            'is_featured',
            'title',
            'summary',
            'content',
            'key_takeaways',
            'title_te',
            'summary_te',
            'content_te',
            'key_takeaways_te',
            'title_hi',
            'summary_hi',
            'content_hi',
            'key_takeaways_hi',
            'title_mr',
            'summary_mr',
            'content_mr',
            'key_takeaways_mr',
            'created_at',
            'updated_at',
        ]
