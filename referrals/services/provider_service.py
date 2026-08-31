import logging
from django.db.models import Q
from ..models import HealthcareProvider, DoctorReferral
from ..serializers import calculate_haversine_distance

logger = logging.getLogger(__name__)


class ProviderService:
    """
    Isolated service layer for searching healthcare providers and managing patient referrals.
    Guarantees that the AI Assistant and APIs only consume authentic database records.
    """

    @classmethod
    def search_providers(cls, query=None, specialization=None, city=None, availability=None, verification_status='verified', lat=None, lng=None, limit=10):
        """
        Query verified healthcare providers from database with optional filters & Haversine distance sorting.
        """
        qs = HealthcareProvider.objects.all()

        if verification_status:
            qs = qs.filter(verification_status=verification_status)

        if specialization:
            qs = qs.filter(specialization__icontains=specialization)

        if city:
            qs = qs.filter(city__icontains=city)

        if availability:
            qs = qs.filter(availability_status=availability)

        if query:
            qs = qs.filter(
                Q(name__icontains=query) |
                Q(specialization__icontains=query) |
                Q(hospital_name__icontains=query) |
                Q(qualification__icontains=query) |
                Q(city__icontains=query)
            )

        providers = list(qs[:50])

        # If user coordinates provided, compute distance and sort
        if lat is not None and lng is not None:
            for p in providers:
                p.distance_km = calculate_haversine_distance(lat, lng, p.latitude, p.longitude)
            # Sort by distance (None at the end)
            providers.sort(key=lambda x: (x.distance_km is None, x.distance_km or 999999))

        return providers[:limit]

    @classmethod
    def get_patient_referrals(cls, user):
        """
        Retrieve patient's active and historical doctor referrals safely.
        """
        if not user or not user.is_authenticated:
            return DoctorReferral.objects.none()
        return DoctorReferral.objects.filter(patient=user).select_related('referred_provider').order_by('-created_at')

    @classmethod
    def format_providers_for_ai(cls, providers):
        """
        Format database provider records into a structured neutral text summary for AI consumption.
        """
        if not providers:
            return "No verified providers found matching the criteria in the SevaHealth directory."

        lines = []
        for idx, p in enumerate(providers, 1):
            dist_str = f" ({round(p.distance_km, 1)} km away)" if hasattr(p, 'distance_km') and p.distance_km is not None else ""
            status_badge = "Verified in SevaHealth Provider Directory" if p.verification_status == 'verified' else p.verification_status
            lines.append(
                f"{idx}. Dr. {p.name} - {p.specialization} ({p.qualification})\n"
                f"   🏥 Hospital: {p.hospital_name}, {p.city}, {p.state}{dist_str}\n"
                f"   ⭐ Experience: {p.experience_years} years | 📞 Contact: {p.phone_number}\n"
                f"   ✓ Status: {status_badge} | Availability: {p.get_availability_status_display()} | Consultation: {p.get_consultation_type_display()}"
            )

        return "\n\n".join(lines)

    @classmethod
    def format_referrals_for_ai(cls, referrals):
        """
        Format patient referral records into structured text for AI context.
        """
        if not referrals:
            return "No active doctor referrals found for this patient."

        lines = []
        for idx, ref in enumerate(referrals, 1):
            prov_info = f"Dr. {ref.referred_provider.name} ({ref.referred_provider.hospital_name})" if ref.referred_provider else "Specialist pending"
            lines.append(
                f"{idx}. Referral for {ref.specialty}\n"
                f"   👨‍⚕️ Referred By: Dr. {ref.referring_doctor_name} ({ref.referring_facility})\n"
                f"   🩺 Recommended Specialist: {prov_info}\n"
                f"   📋 Reason: {ref.reason}\n"
                f"    status: {ref.get_status_display()} | Date: {ref.created_at.strftime('%d %b %Y')}"
            )

        return "\n\n".join(lines)
