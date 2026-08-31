from django.core.management.base import BaseCommand
from emergency.seed_data import seed_initial_facilities

class Command(BaseCommand):
    help = 'Seeds initial 24/7 emergency healthcare facilities in Hyderabad, Telangana'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding 24/7 emergency facilities...")
        count = seed_initial_facilities()
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} emergency facility records!"))
