from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Patient, Doctor, MedicalDocument
from .serializers import (
    UserSerializer,
    PatientSerializer,
    DoctorSerializer,
    MedicalDocumentSerializer,
)


# ===================================
# Register User
# ===================================
@api_view(["POST"])
def register(request):

    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():

        user = serializer.save()

        return Response(
            {
                "message": "Registration Successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===================================
# Login
# ===================================
@api_view(["POST"])
def login(request):

    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user:

        return Response(
            {
                "message": "Login Successful",
                "username": user.username,
                "email": user.email,
            }
        )

    return Response(
        {"error": "Invalid Username or Password"},
        status=status.HTTP_401_UNAUTHORIZED,
    )


# ===================================
# Create Patient
# ===================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_patient(request):

    serializer = PatientSerializer(data=request.data)

    if serializer.is_valid():

        serializer.save()

        return Response(
            {
                "message": "Patient Created Successfully",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===================================
# Create Doctor
# ===================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_doctor(request):

    serializer = DoctorSerializer(data=request.data)

    if serializer.is_valid():

        serializer.save()

        return Response(
            {
                "message": "Doctor Created Successfully",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===================================
# Profile
# ===================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):

    try:

        patient = Patient.objects.get(user=request.user)

        return Response(
            {
                "message": "Patient Profile Fetched Successfully",
                "user": {
                    "username": request.user.username,
                    "first_name": request.user.first_name,
                    "last_name": request.user.last_name,
                    "email": request.user.email,
                },
                "patient": {
                    "phone": patient.phone,
                    "date_of_birth": patient.date_of_birth,
                    "gender": patient.gender,
                    "language_preference": patient.language_preference,
                    "emergency_contact": patient.emergency_contact,
                },
            }
        )

    except Patient.DoesNotExist:

        return Response(
            {"error": "Patient profile not found"},
            status=status.HTTP_404_NOT_FOUND,
        )


# ===================================
# Upload Medical Document
# ===================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_medical_document(request):

    try:
        patient = Patient.objects.get(user=request.user)

    except Patient.DoesNotExist:

        return Response(
            {"error": "Patient profile not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = request.data.copy()
    data["patient"] = patient.id

    serializer = MedicalDocumentSerializer(data=data)

    if serializer.is_valid():

        serializer.save()

        return Response(
            {
                "message": "Medical document uploaded successfully",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===================================
# List Medical Documents
# ===================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medical_document_list(request):

    try:
        patient = Patient.objects.get(user=request.user)

    except Patient.DoesNotExist:

        return Response(
            {"error": "Patient profile not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    documents = MedicalDocument.objects.filter(patient=patient)

    serializer = MedicalDocumentSerializer(documents, many=True)

    return Response(
        {
            "message": "Medical documents fetched successfully",
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )