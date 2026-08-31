from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import HealthcareProvider, DoctorReferral
from .serializers import HealthcareProviderSerializer, DoctorReferralSerializer
from .services.provider_service import ProviderService


class HealthcareProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for searching and viewing verified doctor specialists and healthcare providers.
    Supports filtering by specialization, city, availability, and geographic distance.
    """
    serializer_class = HealthcareProviderSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        lat = self.request.query_params.get('latitude') or self.request.query_params.get('lat')
        lon = self.request.query_params.get('longitude') or self.request.query_params.get('lng')
        if lat and lon:
            try:
                context['user_lat'] = float(lat)
                context['user_lon'] = float(lon)
            except ValueError:
                pass
        return context

    def get_queryset(self):
        # Auto-migrate and seed verified provider directory if database table does not exist or is empty
        try:
            from django.core.management import call_command
            call_command('migrate', 'referrals', verbosity=0)
            if HealthcareProvider.objects.count() == 0:
                call_command('seed_providers')
        except Exception as e:
            pass

        queryset = HealthcareProvider.objects.all()
        
        specialization = self.request.query_params.get('specialization')
        city = self.request.query_params.get('city')
        availability = self.request.query_params.get('availability')
        verification = self.request.query_params.get('verification', 'verified')
        search_query = self.request.query_params.get('q') or self.request.query_params.get('search')

        if verification and verification != 'all':
            queryset = queryset.filter(verification_status=verification)

        if specialization:
            queryset = queryset.filter(specialization__icontains=specialization)

        if city:
            queryset = queryset.filter(city__icontains=city)

        if availability:
            queryset = queryset.filter(availability_status=availability)

        if search_query:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(specialization__icontains=search_query) |
                Q(hospital_name__icontains=search_query) |
                Q(qualification__icontains=search_query) |
                Q(city__icontains=search_query)
            )

        return queryset

    @action(detail=False, methods=['get'], url_path='verified')
    def verified_providers(self, request):
        """GET /api/referrals/providers/verified/"""
        providers = self.get_queryset().filter(verification_status='verified')
        serializer = self.get_serializer(providers, many=True)
        return Response({"count": providers.count(), "results": serializer.data})

    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby_providers(self, request):
        """GET /api/referrals/providers/nearby/?lat=17.385&lng=78.486"""
        lat = request.query_params.get('latitude') or request.query_params.get('lat')
        lng = request.query_params.get('longitude') or request.query_params.get('lng')
        spec = request.query_params.get('specialization')
        city = request.query_params.get('city')

        try:
            lat_f = float(lat) if lat else None
            lng_f = float(lng) if lng else None
        except ValueError:
            lat_f, lng_f = None, None

        providers = ProviderService.search_providers(
            specialization=spec,
            city=city,
            lat=lat_f,
            lng=lng_f,
            limit=20
        )

        serializer = self.get_serializer(providers, many=True)
        return Response({
            "count": len(providers),
            "user_coordinates": {"latitude": lat_f, "longitude": lng_f} if lat_f else None,
            "results": serializer.data
        })


class DoctorReferralViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and managing patient doctor referrals.
    Restricted to authenticated patients (or staff).
    """
    serializer_class = DoctorReferralSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            from django.core.management import call_command
            from django.db import connection
            call_command('migrate', 'referrals', verbosity=0)
            with connection.cursor() as cursor:
                try:
                    cursor.execute("ALTER TABLE referrals_doctorreferral ADD COLUMN suggested_doctor_name varchar(255) DEFAULT '';")
                except Exception:
                    pass
        except Exception:
            pass
        # Patient can only view their own referrals for privacy protection
        return DoctorReferral.objects.filter(patient=self.request.user).select_related('referred_provider').order_by('-created_at')

    def perform_create(self, serializer):
        from django.db import connection
        with connection.cursor() as cursor:
            try:
                cursor.execute("ALTER TABLE referrals_doctorreferral ADD COLUMN suggested_doctor_name varchar(255) DEFAULT '';")
            except Exception:
                pass
        serializer.save(patient=self.request.user)
