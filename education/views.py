import io
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .models import HealthEducationArticle
from .serializers import HealthEducationArticleSerializer
from .education_data import HEALTH_EDUCATION_GUIDES

def ensure_articles_seeded():
    """Seed articles if database is currently empty."""
    if HealthEducationArticle.objects.count() == 0:
        for item in HEALTH_EDUCATION_GUIDES:
            HealthEducationArticle.objects.create(**item)

class HealthEducationArticleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HealthEducationArticle.objects.all().order_by('-is_featured', 'id')
    serializer_class = HealthEducationArticleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        ensure_articles_seeded()
        qs = HealthEducationArticle.objects.all().order_by('-is_featured', 'id')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')

        if category and category != 'all':
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(summary__icontains=search)
        return qs

    @action(detail=True, methods=['get'])
    def audio(self, request, pk=None):
        """Generate/stream spoken TTS audio reading of the article in regional languages."""
        article = self.get_object()
        lang = request.query_params.get('lang', 'en').lower()

        # Select text and language code
        if lang in ['te', 'te-in', 'telugu']:
            text = f"{article.title_te or article.title}. {article.content_te or article.content}"
            gtts_lang = 'te'
        elif lang in ['hi', 'hi-in', 'hindi']:
            text = f"{article.title_hi or article.title}. {article.content_hi or article.content}"
            gtts_lang = 'hi'
        elif lang in ['mr', 'mr-in', 'marathi']:
            text = f"{article.title_mr or article.title}. {article.content_mr or article.content}"
            gtts_lang = 'mr'
        else:
            text = f"{article.title}. {article.content}"
            gtts_lang = 'en'

        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang=gtts_lang, slow=False)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            return HttpResponse(fp.read(), content_type='audio/mpeg')
        except Exception as e:
            return Response(
                {"error": f"Failed to generate TTS audio: {str(e)}", "text_script": text},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
