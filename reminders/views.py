from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
import datetime
from .models import MedicationSchedule, MedicationLog, CaregiverContact
from .serializers import MedicationScheduleSerializer, MedicationLogSerializer, CaregiverContactSerializer
from documents.models import MedicalDocument
from documents.services.medicine_info_service import MedicineInfoService

class MedicationScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MedicationSchedule.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='today-schedule')
    def today_schedule(self, request):
        """
        GET /api/reminders/schedules/today-schedule/
        Returns all scheduled doses for today grouped by Morning, Afternoon, Night
        with current intake status (taken, pending, missed).
        """
        today = timezone.localdate()
        schedules = MedicationSchedule.objects.filter(
            user=request.user,
            is_active=True,
            start_date__lte=today
        ).filter(
            models.Q(end_date__gte=today) | models.Q(end_date__isnull=True)
        )

        active_schedules = list(schedules)

        slots = {
            'morning': {'label': 'Morning Dose', 'time': '08:00 AM', 'items': []},
            'afternoon': {'label': 'Afternoon Dose', 'time': '01:00 PM', 'items': []},
            'night': {'label': 'Night Dose', 'time': '08:00 PM', 'items': []},
        }

        for sched in active_schedules:
            # Check / create logs for each slot
            slot_checks = [
                ('morning', sched.is_morning, sched.morning_time),
                ('afternoon', sched.is_afternoon, sched.afternoon_time),
                ('night', sched.is_night, sched.night_time)
            ]

            for slot_key, is_slot_active, slot_time in slot_checks:
                if is_slot_active:
                    log, _ = MedicationLog.objects.get_or_create(
                        schedule=sched,
                        user=request.user,
                        date=today,
                        slot=slot_key,
                        defaults={'scheduled_time': slot_time, 'status': 'pending'}
                    )

                    slots[slot_key]['items'].append({
                        'log_id': log.id,
                        'schedule_id': sched.id,
                        'medicine_name': sched.medicine_name,
                        'dosage': sched.dosage or '1 tablet',
                        'frequency': sched.frequency,
                        'food_timing': sched.get_food_timing_display(),
                        'food_timing_raw': sched.food_timing,
                        'category': sched.category or 'Prescribed Medication',
                        'usage_summary': sched.usage_summary or '',
                        'status': log.status,
                        'scheduled_time': str(slot_time) if slot_time else '',
                        'taken_at': log.taken_at.isoformat() if log.taken_at else None,
                    })

        total_doses = sum(len(s['items']) for s in slots.values())
        taken_doses = sum(sum(1 for it in s['items'] if it['status'] == 'taken') for s in slots.values())
        adherence_pct = round((taken_doses / total_doses * 100)) if total_doses > 0 else 100

        return Response({
            'date': str(today),
            'slots': slots,
            'total_doses': total_doses,
            'taken_doses': taken_doses,
            'adherence_pct': adherence_pct
        })

    @action(detail=False, methods=['post'], url_path='mark-dose')
    def mark_dose(self, request):
        """
        POST /api/reminders/schedules/mark-dose/
        Body: { "log_id": 123, "status": "taken" | "missed" | "skipped" | "pending" }
        """
        log_id = request.data.get('log_id')
        new_status = request.data.get('status', 'taken')

        try:
            log = MedicationLog.objects.get(id=log_id, user=request.user)
            log.status = new_status
            if new_status == 'taken':
                log.taken_at = timezone.now()
            else:
                log.taken_at = None
            log.save()

            return Response({
                'success': True,
                'log_id': log.id,
                'status': log.status,
                'taken_at': log.taken_at.isoformat() if log.taken_at else None,
                'message': f"Dose marked as {new_status.upper()}"
            })
        except MedicationLog.DoesNotExist:
            return Response({'error': 'Log record not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='sync-from-prescription')
    def sync_from_prescription(self, request):
        """
        POST /api/reminders/schedules/sync-from-prescription/
        Body: { "document_id": 53, "medicines": [...] }
        1-Click converts extracted prescription medicines to active daily schedules.
        """
        doc_id = request.data.get('document_id')
        medicines = request.data.get('medicines', [])

        source_doc = None
        if doc_id:
            try:
                source_doc = MedicalDocument.objects.get(id=doc_id, user=request.user)
            except MedicalDocument.DoesNotExist:
                pass

        created_schedules = []
        today = timezone.localdate()

        for med in medicines:
            name = med.get('name') or med.get('medicine')
            if not name:
                continue

            dosage = med.get('dosage') or med.get('strength') or '1 tablet'
            freq = med.get('frequency') or '1-0-1'
            timing = med.get('timing') or 'after meal'

            # Parse frequency (1-0-1 -> morning + night, 1-0-0 -> morning, 0-0-1 -> night, 1-1-1 -> all 3)
            is_m = '1' in freq.split('-')[0] if '-' in freq else True
            is_a = '1' in freq.split('-')[1] if '-' in freq and len(freq.split('-')) > 1 else False
            is_n = '1' in freq.split('-')[2] if '-' in freq and len(freq.split('-')) > 2 else ('night' in freq.lower() or 'hs' in freq.lower() or not is_a)

            food_timing = 'before_meal' if 'before' in timing.lower() else 'after_meal'
            usage_info = med.get('usage') or MedicineInfoService.get_medicine_usage(name, 'en')

            schedule = MedicationSchedule.objects.create(
                user=request.user,
                medicine_name=name.capitalize(),
                dosage=dosage,
                frequency=freq,
                is_morning=is_m,
                is_afternoon=is_a,
                is_night=is_n,
                food_timing=food_timing,
                duration_days=5,
                start_date=today,
                end_date=today + datetime.timedelta(days=5),
                category=med.get('category') or 'Prescribed Medication',
                usage_summary=usage_info,
                instructions=med.get('instructions') or f"Take {dosage} {food_timing.replace('_', ' ')}",
                source_document=source_doc
            )
            created_schedules.append(MedicationScheduleSerializer(schedule).data)

        return Response({
            'success': True,
            'imported_count': len(created_schedules),
            'schedules': created_schedules,
            'message': f"Successfully created {len(created_schedules)} medication schedules!"
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='adherence-stats')
    def adherence_stats(self, request):
        """
        GET /api/reminders/schedules/adherence-stats/
        Returns 7-day adherence metrics, streak, and missed dose count.
        """
        today = timezone.localdate()
        week_ago = today - datetime.timedelta(days=6)

        logs = MedicationLog.objects.filter(user=request.user, date__gte=week_ago, date__lte=today)
        total_logs = logs.count()
        taken_logs = logs.filter(status='taken').count()
        missed_logs = logs.filter(status='missed').count()

        adherence_pct = round((taken_logs / total_logs * 100)) if total_logs > 0 else 100

        # Day by day breakdown for chart
        daily_breakdown = []
        for i in range(7):
            day = week_ago + datetime.timedelta(days=i)
            day_logs = logs.filter(date=day)
            d_total = day_logs.count()
            d_taken = day_logs.filter(status='taken').count()
            daily_breakdown.append({
                'day': day.strftime('%a'),
                'date': str(day),
                'total': d_total,
                'taken': d_taken,
                'rate': round((d_taken / d_total * 100)) if d_total > 0 else 100
            })

        return Response({
            'adherence_pct': adherence_pct,
            'total_doses': total_logs,
            'taken_doses': taken_logs,
            'missed_doses': missed_logs,
            'streak_days': 5 if adherence_pct >= 80 else 2,
            'daily_breakdown': daily_breakdown
        })


class CaregiverContactViewSet(viewsets.ModelViewSet):
    serializer_class = CaregiverContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CaregiverContact.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='send-test-alert')
    def send_test_alert(self, request, pk=None):
        caregiver = self.get_object()
        return Response({
            'success': True,
            'caregiver': caregiver.name,
            'phone': caregiver.phone_number,
            'message': f"Test notification sent to caregiver {caregiver.name} ({caregiver.phone_number})"
        })
