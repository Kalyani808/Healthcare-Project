import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .vision_ai_service import VisionAIService

logger = logging.getLogger(__name__)

class SkinConditionAnalyzerView(APIView):
    """
    POST /api/vision-ai/analyze-skin/
    Accepts facial or skin photo and returns AI dermatology assessment with causes, symptoms, safe home care, and red flags.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        image_file = request.FILES.get('image') or request.FILES.get('file')
        image_b64 = request.data.get('image_b64')
        lang = request.data.get('lang', 'en').lower()

        if not image_file and not image_b64:
            return Response(
                {"status": "error", "error": "No skin image file or base64 data provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target = image_file if image_file else image_b64
            result = VisionAIService.analyze_skin_condition(target, lang=lang)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"[SKIN ANALYZER VIEW ERROR] {e}")
            return Response(
                {"status": "error", "error": f"Skin analysis failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PillIdentifierView(APIView):
    """
    POST /api/vision-ai/identify-pill/
    Accepts tablet/capsule/blister photo and returns drug name, generic composition, uses, dosage & food timings, and precautions.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        image_file = request.FILES.get('image') or request.FILES.get('file')
        image_b64 = request.data.get('image_b64')
        lang = request.data.get('lang', 'en').lower()

        if not image_file and not image_b64:
            return Response(
                {"status": "error", "error": "No tablet image file or base64 data provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target = image_file if image_file else image_b64
            result = VisionAIService.identify_pill_from_image(target, lang=lang)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"[PILL IDENTIFIER VIEW ERROR] {e}")
            return Response(
                {"status": "error", "error": f"Pill identification failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SyncPillToReminderView(APIView):
    """
    POST /api/vision-ai/sync-pill-reminder/
    1-Click adds an identified pill to the patient's active daily medication reminder schedule.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        medicine_name = request.data.get('medicine_name', '').strip()
        dosage = request.data.get('dosage', '1 tablet')
        frequency = request.data.get('frequency', '1-0-1')
        food_timing = request.data.get('food_timing', 'after_food')
        instructions = request.data.get('instructions', '')

        if not medicine_name:
            return Response(
                {"status": "error", "error": "Medicine name is required to create reminder."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from reminders.models import MedicationSchedule
            schedule = MedicationSchedule.objects.create(
                user=request.user,
                medicine_name=medicine_name,
                dosage=dosage,
                frequency=frequency,
                food_timing=food_timing,
                instructions=instructions or f"Identified via Visual Pill Scanner. Take {food_timing.replace('_', ' ')}.",
                is_active=True
            )
            return Response(
                {
                    "status": "success",
                    "message": f"Successfully added {medicine_name} to your daily medication reminders!",
                    "schedule_id": schedule.id
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"[SYNC PILL REMINDER ERROR] {e}")
            return Response(
                {"status": "error", "error": f"Failed to add reminder: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
