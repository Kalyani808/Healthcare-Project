# Generated manually for Issue #4B

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0004_medicaldocument_error_message'),
    ]

    operations = [
        migrations.AddField(
            model_name='medicaldocument',
            name='extracted_data',
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
        migrations.AlterField(
            model_name='medicaldocument',
            name='status',
            field=models.CharField(
                choices=[
                    ('uploaded', 'Uploaded'),
                    ('processing', 'Processing'),
                    ('text_extracted', 'Text Extracted'),
                    ('completed', 'Completed'),
                    ('translated', 'Translated'),
                    ('failed', 'Failed'),
                ],
                default='uploaded',
                max_length=20,
            ),
        ),
    ]
