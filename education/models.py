from django.db import models

class HealthEducationArticle(models.Model):
    CATEGORY_CHOICES = (
        ('preventive', 'Preventive Healthcare'),
        ('maternal', 'Maternal Health'),
        ('child_care', 'Child Healthcare'),
        ('elderly_care', 'Elderly Care'),
    )

    slug = models.SlugField(unique=True, max_length=100)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    icon = models.CharField(max_length=50, default='FaHeartbeat')
    read_time_minutes = models.IntegerField(default=3)

    # English Content
    title = models.CharField(max_length=255)
    summary = models.TextField()
    content = models.TextField()
    key_takeaways = models.JSONField(default=list)

    # Multilingual Content: Telugu (తెలుగు)
    title_te = models.CharField(max_length=255, blank=True)
    summary_te = models.TextField(blank=True)
    content_te = models.TextField(blank=True)
    key_takeaways_te = models.JSONField(default=list, blank=True)

    # Multilingual Content: Hindi (हिंदी)
    title_hi = models.CharField(max_length=255, blank=True)
    summary_hi = models.TextField(blank=True)
    content_hi = models.TextField(blank=True)
    key_takeaways_hi = models.JSONField(default=list, blank=True)

    # Multilingual Content: Marathi (मराठी)
    title_mr = models.CharField(max_length=255, blank=True)
    summary_mr = models.TextField(blank=True)
    content_mr = models.TextField(blank=True)
    key_takeaways_mr = models.JSONField(default=list, blank=True)

    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title}"
