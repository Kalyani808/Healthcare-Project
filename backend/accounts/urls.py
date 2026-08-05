from django.urls import path
from .views import register, login, create_patient, create_doctor, profile
from .views import (
    register,
    login,
    create_patient,
    create_doctor,
    profile,
    upload_medical_document,
    medical_document_list,
)
urlpatterns = [
    path("register/", register),
    path("login/", login),
    path("patient/", create_patient),
    path("doctor/", create_doctor),
    path("profile/", profile),
    path("upload-document/", upload_medical_document),
    path("medical-documents/", upload_medical_document),
path("medical-documents/list/", medical_document_list),
]