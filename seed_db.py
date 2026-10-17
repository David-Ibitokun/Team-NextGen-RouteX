#!/usr/bin/env python3
"""
RouteX Database Seeder
======================
Populates the database with:
- 3 primary account types: Administrator, Moderator, and Citizen (+ extra active community users)
- Operational platform settings singleton
- Diverse real-world road hazards across multiple categories and lifecycle statuses
- Authentic community confirmations and flags (providing data for Moderator Review Queue)
- Recorded moderation actions and system administrative audit trail

Usage:
    python seed_db.py
"""

import os
import sys
from pathlib import Path
from decimal import Decimal
from datetime import timedelta

# Set up environment and Django paths
BASE_DIR = Path(__file__).resolve().parent
if (BASE_DIR / "backend").exists():
    sys.path.insert(0, str(BASE_DIR / "backend"))
else:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from apps.accounts.models import UserProfile, PlatformSettings, SystemAuditLog
from apps.hazards.models import (
    HazardReport,
    HazardCategory,
    HazardStatus,
    Confirmation,
    HazardFlag,
)
from apps.moderation.models import ModerationAction


def seed():
    print("=" * 65)
    print("       RouteX — Database Seeder (Team NextGen)")
    print("=" * 65)

    now = timezone.now()

    # 1. Operational Platform Settings
    print("\n[1/5] Configuring Platform Settings singleton...")
    settings = PlatformSettings.get_settings()
    settings.confirmation_threshold = 3
    settings.freshness_hours = 48
    settings.max_upload_size_mb = 5
    settings.allow_anonymous_map_view = True
    settings.emergency_notice_enabled = True
    settings.save()
    print("  -> Platform settings configured (Confirmation threshold: 3, Freshness: 48h)")

    # 2. Seed Users across all 3 primary access tiers
    print("\n[2/5] Creating user accounts across 3 role tiers...")
    users_data = [
        {
            "username": "admin",
            "email": "admin@routex.org",
            "password": "AdminPassword123!",
            "role": "admin",
            "display_name": "System Administrator",
            "is_staff": True,
            "is_superuser": True,
        },
        {
            "username": "moderator",
            "email": "moderator@routex.org",
            "password": "ModPassword123!",
            "role": "moderator",
            "display_name": "Trust & Safety Moderator",
            "is_staff": True,
            "is_superuser": False,
        },
        {
            "username": "citizen",
            "email": "citizen@routex.org",
            "password": "CitizenPassword123!",
            "role": "citizen",
            "display_name": "Active Commuter",
            "is_staff": False,
            "is_superuser": False,
        },
        {
            "username": "chidi_okonkwo",
            "email": "chidi@routex.org",
            "password": "Citizen123!",
            "role": "citizen",
            "display_name": "Chidi Okonkwo",
            "is_staff": False,
            "is_superuser": False,
        },
        {
            "username": "amara_adebayo",
            "email": "amara@routex.org",
            "password": "Citizen123!",
            "role": "citizen",
            "display_name": "Amara Adebayo",
            "is_staff": False,
            "is_superuser": False,
        },
        {
            "username": "tunde_balogun",
            "email": "tunde@routex.org",
            "password": "Citizen123!",
            "role": "citizen",
            "display_name": "Tunde Balogun",
            "is_staff": False,
            "is_superuser": False,
        },
    ]

    seeded_users = {}
    for udata in users_data:
        user, created = User.objects.get_or_create(username=udata["username"])
        user.email = udata["email"]
        user.is_staff = udata["is_staff"]
        user.is_superuser = udata["is_superuser"]
        user.set_password(udata["password"])
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.display_name = udata["display_name"]
        profile.role = udata["role"]
        profile.save()

        seeded_users[udata["username"]] = user
        status_label = "Created" if created else "Updated"
        print(f"  -> [{status_label}] @{user.username:<15} | Role: {udata['role']:<10} | {udata['display_name']}")

    # 3. Seed Realistic Hazards
    print("\n[3/5] Seeding community road hazards...")
    hazards_data = [
        {
            "id": 1,
            "category": HazardCategory.FLOODING,
            "location_label": "Lekki-Epe Expressway by Jakande Roundabout",
            "description": "Deep standing flood water extending across the right two lanes after heavy downpour. Impassable for sedans; causing severe bottleneck toward Victoria Island.",
            "latitude": Decimal("6.438500"),
            "longitude": Decimal("3.513200"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 3,
            "is_demo": False,
        },
        {
            "id": 2,
            "category": HazardCategory.POTHOLE,
            "location_label": "Third Mainland Bridge (Adekunle Inward Ramp)",
            "description": "Cluster of three sharp crater potholes right at the crest of the off-ramp curve. Poses severe blowout hazard to unaware motorists at speed.",
            "latitude": Decimal("6.495200"),
            "longitude": Decimal("3.389100"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["chidi_okonkwo"],
            "created_hours_ago": 6,
            "is_demo": False,
        },
        {
            "id": 3,
            "category": HazardCategory.BLOCKED_ROAD,
            "location_label": "Apapa-Oshodi Expressway near Mile 2 Flyover",
            "description": "Articulated container truck broken down across service lane. Traffic diverted onto single inner lane; heavy slow-moving queue.",
            "latitude": Decimal("6.467800"),
            "longitude": Decimal("3.321400"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["tunde_balogun"],
            "created_hours_ago": 1,
            "is_demo": False,
        },
        {
            "id": 4,
            "category": HazardCategory.FALLEN_TREE,
            "location_label": "Alfred Rewane Road (Kingsway), Ikoyi",
            "description": "Large fallen mahogany branch obstructing pedestrian walkway and outer motor lane near Golden Gate restaurant. Power lines clear.",
            "latitude": Decimal("6.452100"),
            "longitude": Decimal("3.442800"),
            "status": HazardStatus.UNDER_REVIEW,
            "reporter": seeded_users["amara_adebayo"],
            "created_hours_ago": 12,
            "is_demo": False,
        },
        {
            "id": 5,
            "category": HazardCategory.POTHOLE,
            "location_label": "Ikorodu Road by Maryland Interchange",
            "description": "Severely degraded asphalt section with exposed iron reinforcement mesh. Motorists forced into abrupt braking.",
            "latitude": Decimal("6.572100"),
            "longitude": Decimal("3.368400"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 24,
            "is_demo": False,
        },
        {
            "id": 6,
            "category": HazardCategory.FLOODING,
            "location_label": "Ozumba Mbadiwe Avenue near Civic Centre, Victoria Island",
            "description": "Overflowing storm drain causing curb-height water accumulation on both sides of the dual carriageway.",
            "latitude": Decimal("6.431200"),
            "longitude": Decimal("3.424300"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["chidi_okonkwo"],
            "created_hours_ago": 2,
            "is_demo": False,
        },
        {
            "id": 7,
            "category": HazardCategory.BLOCKED_ROAD,
            "location_label": "Lagos-Ibadan Expressway near Kara Cattle Market",
            "description": "Multiple stalled heavy haulage vehicles causing extensive backup past the Berger outward bridge.",
            "latitude": Decimal("6.648900"),
            "longitude": Decimal("3.398200"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["amara_adebayo"],
            "created_hours_ago": 5,
            "is_demo": False,
        },
        {
            "id": 8,
            "category": HazardCategory.OTHER,
            "location_label": "Broad Street, Lagos Island Central",
            "description": "Missing heavy cast-iron manhole cover in the center lane. Makeshift tree branch placed as temporary warning.",
            "latitude": Decimal("6.453900"),
            "longitude": Decimal("3.392300"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["tunde_balogun"],
            "created_hours_ago": 4,
            "is_demo": False,
        },
        {
            "id": 9,
            "category": HazardCategory.POTHOLE,
            "location_label": "Ahmadu Bello Way by Bar Beach, Victoria Island",
            "description": "Deep depression at intersection repaired by road maintenance team. Surface is freshly asphalted and traffic flowing freely.",
            "latitude": Decimal("6.425800"),
            "longitude": Decimal("3.419000"),
            "status": HazardStatus.RESOLVED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 72,
            "is_demo": False,
        },
        {
            "id": 10,
            "category": HazardCategory.FALLEN_TREE,
            "location_label": "Bourdillon Road, Ikoyi",
            "description": "Fallen tree branch cleared by emergency public works crew. Roadway completely reopened.",
            "latitude": Decimal("6.449500"),
            "longitude": Decimal("3.451000"),
            "status": HazardStatus.RESOLVED,
            "reporter": seeded_users["chidi_okonkwo"],
            "created_hours_ago": 96,
            "is_demo": False,
        },
        {
            "id": 11,
            "category": HazardCategory.BLOCKED_ROAD,
            "location_label": "Herbert Macaulay Way by Sabo Yaba",
            "description": "Report claimed complete road closure due to private event. Community members flagged that roadway is actually open.",
            "latitude": Decimal("6.508200"),
            "longitude": Decimal("3.377100"),
            "status": HazardStatus.UNDER_REVIEW,
            "reporter": seeded_users["tunde_balogun"],
            "created_hours_ago": 8,
            "is_demo": False,
        },
        {
            "id": 12,
            "category": HazardCategory.FLOODING,
            "location_label": "Agege Motor Road near Oshodi Interchange",
            "description": "Flash flooding from choked culvert. Water rising along railway corridor approach.",
            "latitude": Decimal("6.538000"),
            "longitude": Decimal("3.352000"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 1,
            "is_demo": False,
        },
    ]

    seeded_hazards = {}
    for hdata in hazards_data:
        report, created = HazardReport.objects.update_or_create(
            id=hdata["id"],
            defaults={
                "category": hdata["category"],
                "location_label": hdata["location_label"],
                "description": hdata["description"],
                "latitude": hdata["latitude"],
                "longitude": hdata["longitude"],
                "status": hdata["status"],
                "reporter": hdata["reporter"],
                "is_demo": hdata["is_demo"],
            }
        )
        # Update timestamps cleanly
        past_time = now - timedelta(hours=hdata["created_hours_ago"])
        HazardReport.objects.filter(id=report.id).update(created_at=past_time, updated_at=past_time)
        seeded_hazards[hdata["id"]] = report
        print(f"  -> Hazard #{report.id:<2} [{report.category:<12}] {report.location_label} ({report.status})")

    # 4. Seed Confirmations, Flags, and Moderation Actions
    print("\n[4/5] Seeding community confirmations, flags, and moderation decisions...")
    # Add confirmations
    confirmations_plan = [
        # Report 1 (Lekki-Epe flooding): 4 confirmations
        (1, [seeded_users["chidi_okonkwo"], seeded_users["amara_adebayo"], seeded_users["tunde_balogun"], seeded_users["moderator"]]),
        # Report 2 (Third Mainland Bridge pothole): 5 confirmations
        (2, [seeded_users["citizen"], seeded_users["amara_adebayo"], seeded_users["tunde_balogun"], seeded_users["moderator"], seeded_users["admin"]]),
        # Report 5 (Ikorodu Road pothole): 4 confirmations
        (5, [seeded_users["chidi_okonkwo"], seeded_users["amara_adebayo"], seeded_users["tunde_balogun"], seeded_users["moderator"]]),
        # Report 7 (Lagos-Ibadan breakdown): 3 confirmations
        (7, [seeded_users["citizen"], seeded_users["chidi_okonkwo"], seeded_users["tunde_balogun"]]),
    ]

    total_confirmations = 0
    for report_id, conf_users in confirmations_plan:
        report = seeded_hazards[report_id]
        for u in conf_users:
            Confirmation.objects.get_or_create(report=report, user=u)
            total_confirmations += 1
        count = report.confirmations.count()
        HazardReport.objects.filter(id=report.id).update(confirmations_count=count)
    print(f"  -> Generated {total_confirmations} community confirmations across verified hazards")

    # Add flags for the Moderator Queue
    flags_plan = [
        # Report 11 (Herbert Macaulay): 2 flags -> queued in /moderation!
        (11, seeded_users["citizen"], "inaccurate", "Road is open, only the service parking lane is restricted."),
        (11, seeded_users["chidi_okonkwo"], "cleared", "I just drove through Sabo Yaba, traffic is flowing normally."),
        # Report 4 (Alfred Rewane fallen tree): 1 flag
        (4, seeded_users["tunde_balogun"], "duplicate", "Similar obstruction reported earlier on this corridor."),
    ]

    total_flags = 0
    for report_id, flagger, reason, notes in flags_plan:
        report = seeded_hazards[report_id]
        HazardFlag.objects.get_or_create(
            report=report,
            reporter=flagger,
            defaults={"reason": reason, "notes": notes, "status": "pending"}
        )
        total_flags += 1
        count = report.flags.count()
        HazardReport.objects.filter(id=report.id).update(flags_count=count)
    print(f"  -> Generated {total_flags} community flags queued for Moderator review")

    # Add historical Moderation Actions (for the /moderation Decision History tab)
    ModerationAction.objects.get_or_create(
        report=seeded_hazards[9],
        moderator=seeded_users["moderator"],
        action="resolve",
        defaults={
            "reason": "Road maintenance team confirmed asphalt resurfacing completed at Bar Beach intersection.",
            "created_at": now - timedelta(days=2),
        }
    )
    ModerationAction.objects.get_or_create(
        report=seeded_hazards[10],
        moderator=seeded_users["moderator"],
        action="resolve",
        defaults={
            "reason": "Public works branch clearance verified by community observers.",
            "created_at": now - timedelta(days=3),
        }
    )
    print("  -> Logged historical moderation decisions in audit table")

    # 5. System Administrative Audit Logs (for /admin-dashboard)
    print("\n[5/5] Generating system administrative audit history...")
    SystemAuditLog.objects.get_or_create(
        actor=seeded_users["admin"],
        action_type="SETTINGS_UPDATE",
        target_id="settings:1",
        defaults={
            "details": "Initialized operational settings: confirmation_threshold=3, freshness_hours=48, max_upload_size_mb=5",
            "created_at": now - timedelta(days=5),
        }
    )
    SystemAuditLog.objects.get_or_create(
        actor=seeded_users["admin"],
        action_type="ROLE_CHANGE",
        target_id=str(seeded_users["moderator"].id),
        defaults={
            "details": "Promoted user @moderator from citizen to moderator role for trust and safety review duty.",
            "created_at": now - timedelta(days=4),
        }
    )
    print("  -> Administrative audit events logged")

    print("\n" + "=" * 65)
    print("       DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print("=" * 65)
    print("\nLOGIN CREDENTIALS SUMMARY:")
    print("-" * 65)
    print(f" 1. ADMINISTRATOR PORTAL  (/admin-dashboard or /admin)")
    print(f"    Username:  admin")
    print(f"    Password:  AdminPassword123!")
    print(f"    Role:      admin (full platform governance & operational settings)")
    print("-" * 65)
    print(f" 2. MODERATOR WORKSPACE   (/moderator or /moderation)")
    print(f"    Username:  moderator")
    print(f"    Password:  ModPassword123!")
    print(f"    Role:      moderator (review queue, inspection, decisions)")
    print("-" * 65)
    print(f" 3. CITIZEN DASHBOARD     (/dashboard or /my-reports)")
    print(f"    Username:  citizen")
    print(f"    Password:  CitizenPassword123!")
    print(f"    Role:      citizen (hazard reporting, confirmations, impact stats)")
    print("-" * 65)
    print(f" Extra Active Commuters:   chidi_okonkwo, amara_adebayo, tunde_balogun")
    print(f" Password for extra users: Citizen123!")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    seed()
