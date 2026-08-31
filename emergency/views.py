import math
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmergencyContact, EmergencyFacility
from .serializers import EmergencyContactSerializer, EmergencyFacilitySerializer
from .first_aid_data import FIRST_AID_GUIDES
from .seed_data import seed_initial_facilities

logger = logging.getLogger(__name__)

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points on the earth in kilometers.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    try:
        lat1, lon1, lat2, lon2 = map(math.radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0) ** 2
        c = 2 * math.asin(math.sqrt(a))
        return c * 6371.0  # Radius of Earth in kilometers
    except Exception as e:
        logger.warning(f"Error in Haversine distance calculation: {e}")
        return None


class EmergencyContactViewSet(viewsets.ModelViewSet):
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EmergencyContact.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class EmergencyFacilityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EmergencyFacilitySerializer
    permission_classes = [permissions.AllowAny]
    queryset = EmergencyFacility.objects.all()

    def get_queryset(self):
        # Auto-seed initial facilities if database table is currently empty
        if EmergencyFacility.objects.count() == 0:
            seed_initial_facilities()
        return EmergencyFacility.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        user_lat = request.query_params.get('latitude') or request.query_params.get('lat')
        user_lng = request.query_params.get('longitude') or request.query_params.get('lng') or request.query_params.get('lon')
        facility_type = request.query_params.get('type') or request.query_params.get('facility_type')

        # Filter by facility type if specified
        if facility_type and facility_type != 'all':
            if facility_type == 'hospital':
                queryset = queryset.filter(facility_type__in=['hospital', 'emergency_room', 'cardiac_center', 'burn_unit'])
            else:
                queryset = queryset.filter(facility_type=facility_type)

        facilities_list = list(queryset)

        # Calculate distances if user GPS coordinates are provided
        if user_lat is not None and user_lng is not None:
            try:
                u_lat = float(user_lat)
                u_lng = float(user_lng)
                for f in facilities_list:
                    if f.latitude is not None and f.longitude is not None:
                        dist = calculate_haversine_distance(u_lat, u_lng, f.latitude, f.longitude)
                        f.calculated_distance = dist
                    else:
                        f.calculated_distance = float('inf')
                
                facilities_list.sort(key=lambda x: getattr(x, 'calculated_distance', float('inf')))
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid latitude/longitude parameters passed: {e}")

        serializer = self.get_serializer(facilities_list, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby(self, request):
        """
        GET /api/emergency/facilities/nearby/?latitude=...&longitude=...&type=...
        Returns facilities ordered by geographic distance from user location.
        """
        queryset = self.get_queryset()

        user_lat = request.query_params.get('latitude') or request.query_params.get('lat')
        user_lng = request.query_params.get('longitude') or request.query_params.get('lng') or request.query_params.get('lon')
        facility_type = request.query_params.get('type') or request.query_params.get('facility_type')
        city = request.query_params.get('city', 'Hyderabad')

        if city and not (user_lat and user_lng):
            queryset = queryset.filter(city__icontains=city)

        if facility_type and facility_type != 'all':
            if facility_type == 'hospital':
                queryset = queryset.filter(facility_type__in=['hospital', 'emergency_room', 'cardiac_center', 'burn_unit'])
            else:
                queryset = queryset.filter(facility_type=facility_type)

        facilities_list = list(queryset)

        if user_lat is not None and user_lng is not None:
            try:
                u_lat = float(user_lat)
                u_lng = float(user_lng)
                for f in facilities_list:
                    if f.latitude is not None and f.longitude is not None:
                        dist = calculate_haversine_distance(u_lat, u_lng, f.latitude, f.longitude)
                        f.calculated_distance = dist
                    else:
                        f.calculated_distance = float('inf')
                
                facilities_list.sort(key=lambda x: getattr(x, 'calculated_distance', float('inf')))
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid coordinates in nearby: {e}")

        serializer = self.get_serializer(facilities_list, many=True)
        return Response({
            'city': city,
            'count': len(facilities_list),
            'facilities': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='first-aid')
    def first_aid_guides(self, request):
        guide_id = request.query_params.get('id')
        if guide_id:
            matched = next((g for g in FIRST_AID_GUIDES if g['id'] == guide_id), None)
            if matched:
                return Response(matched)
            return Response({'error': 'Guide not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'count': len(FIRST_AID_GUIDES),
            'guides': FIRST_AID_GUIDES
        })

    @action(detail=False, methods=['post'], url_path='sos-trigger')
    def sos_trigger(self, request):
        """
        POST /api/emergency/facilities/sos-trigger/
        Generates immediate SOS alert payload with GPS coords & emergency broadcast.
        """
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        user = request.user if request.user.is_authenticated else None

        contacts = EmergencyContact.objects.filter(user=user) if user else []
        contact_list = [{'name': c.name, 'phone': c.phone_number, 'rel': c.relationship} for c in contacts]

        return Response({
            'status': 'SOS_ACTIVATED',
            'ambulance_number': '108',
            'national_emergency': '112',
            'latitude': lat,
            'longitude': lng,
            'emergency_contacts_notified': contact_list,
            'message': 'Emergency SOS recorded. Contacting nearest 108 ambulance dispatch and emergency contacts.'
        })
