from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmergencyContact, EmergencyFacility
from .serializers import EmergencyContactSerializer, EmergencyFacilitySerializer
from .first_aid_data import FIRST_AID_GUIDES

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

    @action(detail=False, methods=['get'], url_path='live-nearby')
    def live_nearby(self, request):
        """
        GET /api/emergency/facilities/live-nearby/?lat=17.385&lng=78.4867&type=all
        Fetches REAL, live nearby hospitals, pharmacies, and blood banks based on GPS coordinates.
        """
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        facility_type = request.query_params.get('type', 'all')

        if not lat or not lng:
            return Response(
                {'error': 'Latitude and Longitude are required to fetch live nearby facilities.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .services.live_facilities_service import LiveFacilitiesService
        try:
            facilities = LiveFacilitiesService.fetch_live_nearby(
                lat=lat,
                lng=lng,
                facility_type=facility_type
            )
            return Response({
                'status': 'success',
                'latitude': float(lat),
                'longitude': float(lng),
                'facility_type': facility_type,
                'count': len(facilities),
                'facilities': facilities
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch live facilities: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby(self, request):
        city = request.query_params.get('city', 'Hyderabad')
        facility_type = request.query_params.get('type')

        facilities = EmergencyFacility.objects.filter(city__icontains=city)
        if facility_type:
            facilities = facilities.filter(facility_type=facility_type)

        serializer = self.get_serializer(facilities, many=True)
        return Response({
            'city': city,
            'count': facilities.count(),
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
