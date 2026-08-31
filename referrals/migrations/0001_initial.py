from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='HealthcareProvider',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Full Doctor / Specialist Name', max_length=255)),
                ('specialization', models.CharField(db_index=True, help_text='e.g. Cardiology, Neurology, Orthopedics', max_length=150)),
                ('qualification', models.CharField(help_text='e.g. MBBS, MD (General Medicine), DM (Cardiology)', max_length=200)),
                ('experience_years', models.PositiveIntegerField(default=5, help_text='Years of clinical practice')),
                ('hospital_name', models.CharField(help_text='Hospital / Medical Institute Affiliation', max_length=255)),
                ('address', models.TextField(help_text='Clinical Address')),
                ('city', models.CharField(db_index=True, default='Hyderabad', max_length=100)),
                ('state', models.CharField(default='Telangana', max_length=100)),
                ('pincode', models.CharField(blank=True, default='', max_length=20)),
                ('phone_number', models.CharField(help_text='Hospital Consultation Helpline', max_length=50)),
                ('registration_number', models.CharField(blank=True, default='', help_text='State Medical Council Reg. No.', max_length=100)),
                ('verification_status', models.CharField(choices=[('pending', 'Pending Verification'), ('verified', 'Verified Provider Directory'), ('unavailable', 'Currently Unavailable')], db_index=True, default='verified', help_text='Verification in SevaHealth Provider Directory', max_length=30)),
                ('availability_status', models.CharField(choices=[('available', 'Available Today'), ('limited', 'Limited Slots'), ('unavailable', 'Unavailable')], db_index=True, default='available', max_length=30)),
                ('consultation_type', models.CharField(choices=[('in_person', 'In-Person Consultation'), ('teleconsultation', 'Teleconsultation Only'), ('both', 'In-Person & Teleconsultation')], default='both', max_length=30)),
                ('latitude', models.FloatField(blank=True, help_text='GPS Latitude coordinate', null=True)),
                ('longitude', models.FloatField(blank=True, help_text='GPS Longitude coordinate', null=True)),
                ('profile_description', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Healthcare Provider',
                'verbose_name_plural': 'Healthcare Providers',
                'ordering': ['-experience_years', 'name'],
            },
        ),
        migrations.CreateModel(
            name='DoctorReferral',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('referring_doctor_name', models.CharField(help_text='Name of rural / local doctor who initiated referral', max_length=255)),
                ('referring_facility', models.CharField(help_text='Local Clinic / Primary Health Center (PHC)', max_length=255)),
                ('specialty', models.CharField(help_text='Specialty required e.g. Cardiology', max_length=150)),
                ('reason', models.TextField(help_text='Medical reason for referral')),
                ('notes', models.TextField(blank=True, default='', help_text='Additional clinical notes or diagnosis')),
                ('status', models.CharField(choices=[('active', 'Active Referral'), ('completed', 'Completed Consultation'), ('cancelled', 'Cancelled / Expired')], db_index=True, default='active', max_length=30)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('patient', models.ForeignKey(help_text='Patient receiving referral', on_delete=django.db.models.deletion.CASCADE, related_name='doctor_referrals', to=settings.AUTH_USER_MODEL)),
                ('referred_provider', models.ForeignKey(blank=True, help_text='Recommended specialist doctor from verified directory', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='received_referrals', to='referrals.healthcareprovider')),
                ('suggested_doctor_name', models.CharField(blank=True, default='', help_text='Name of urban doctor suggested by rural clinic, if any', max_length=255)),
            ],
            options={
                'verbose_name': 'Doctor Referral',
                'verbose_name_plural': 'Doctor Referrals',
                'ordering': ['-created_at'],
            },
        ),
    ]
