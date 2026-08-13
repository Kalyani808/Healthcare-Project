from django.contrib import admin
from .models import MedicalDocument


@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ('document_name', 'user', 'document_type', 'status', 'uploaded_at')
    list_filter = ('document_type', 'status')
    search_fields = ('document_name', 'user__username')
    readonly_fields = ('uploaded_at',)