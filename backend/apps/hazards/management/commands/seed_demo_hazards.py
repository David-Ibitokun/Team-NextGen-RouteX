from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.hazards.models import HazardReport, HazardCategory, HazardStatus

DEMO_HAZARDS = [
    {
        "category": HazardCategory.FLOODING,
        "location_label": "Lekki-Epe Expressway, near Jakande Roundabout",
        "description": "Deep standing water across both westbound lanes following heavy morning rain. Slow moving traffic.",
        "latitude": Decimal("6.442800"),
        "longitude": Decimal("3.518600"),
        "status": HazardStatus.COMMUNITY_CONFIRMED,
        "confirmations_count": 4,
    },
    {
        "category": HazardCategory.POTHOLE,
        "location_label": "Oshodi-Isolo Expressway by Toyota Bus Stop",
        "description": "Cluster of severe potholes near the service lane exit damaging tyres. Vehicles braking abruptly.",
        "latitude": Decimal("6.536500"),
        "longitude": Decimal("3.348200"),
        "status": HazardStatus.REPORTED,
        "confirmations_count": 2,
    },
    {
        "category": HazardCategory.BLOCKED_ROAD,
        "location_label": "Third Mainland Bridge inward Adeniji Adele exit",
        "description": "Broken-down container truck occupying center lane causing heavy traffic buildup.",
        "latitude": Decimal("6.495000"),
        "longitude": Decimal("3.393000"),
        "status": HazardStatus.COMMUNITY_CONFIRMED,
        "confirmations_count": 6,
    },
    {
        "category": HazardCategory.FALLEN_TREE,
        "location_label": "Alfred Rewane Road, Ikoyi",
        "description": "Fallen branch blocking pedestrian walkway and rightmost vehicular lane.",
        "latitude": Decimal("6.452000"),
        "longitude": Decimal("3.438000"),
        "status": HazardStatus.UNDER_REVIEW,
        "confirmations_count": 1,
    },
    {
        "category": HazardCategory.OTHER,
        "location_label": "Ikorodu Road, near Maryland Independence Tunnel",
        "description": "Exposed drainage slab on median edge. Motorists advised to use caution when changing lanes.",
        "latitude": Decimal("6.568000"),
        "longitude": Decimal("3.366000"),
        "status": HazardStatus.REPORTED,
        "confirmations_count": 1,
    },
]

class Command(BaseCommand):
    help = "Seeds explicit demo hazards for local development and testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing demo records before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted_count, _ = HazardReport.objects.filter(is_demo=True).delete()
            self.stdout.write(self.style.WARNING(f"Cleared {deleted_count} existing demo hazard reports."))

        created_count = 0
        for item in DEMO_HAZARDS:
            report, created = HazardReport.objects.get_or_create(
                location_label=item["location_label"],
                defaults={
                    "category": item["category"],
                    "description": item["description"],
                    "latitude": item["latitude"],
                    "longitude": item["longitude"],
                    "status": item["status"],
                    "confirmations_count": item["confirmations_count"],
                    "is_demo": True,
                },
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {created_count} demo hazards (all flagged as is_demo=True)."
            )
        )
