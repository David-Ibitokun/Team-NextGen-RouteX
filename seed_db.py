#!/usr/bin/env python3
"""
RouteX Database Seeder
======================
Populates the database with:
- 3 primary account types: Administrator, Moderator, and Citizen (+ extra active community users)
- Operational platform settings singleton
- Diverse real-world road hazards based in Abeokuta, Ogun State
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
    print("      RouteX — Database Seeder (Ogun State/Abeokuta Edition)")
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

    # 3. Seed Realistic Hazards (Abeokuta Focus)
    print("\n[3/5] Seeding community road hazards (Abeokuta, Ogun State)...")
    hazards_data = [
        {
            "id": 1,
            "category": HazardCategory.FLOODING,
            "location_label": "Kuto Road by Kuto Market",
            "description": "Deep standing flood water extending across the road after heavy downpour. Impassable for smaller cars; causing severe bottleneck toward Isabo.",
            "latitude": Decimal("7.147200"),
            "longitude": Decimal("3.344400"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 3,
            "is_demo": False,
        },
        {
            "id": 2,
            "category": HazardCategory.POTHOLE,
            "location_label": "Camp-Obantoko Road (FUNAAB Axis)",
            "description": "Cluster of deep, crater-like potholes right past the Camp junction. Poses severe blowout hazard to unaware motorists and causing massive gridlock during school rush hours.",
            "latitude": Decimal("7.172500"),
            "longitude": Decimal("3.421500"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["chidi_okonkwo"],
            "created_hours_ago": 6,
            "is_demo": False,
        },
        {
            "id": 3,
            "category": HazardCategory.BLOCKED_ROAD,
            "location_label": "Lafenwa Market Road towards Ita Oshin",
            "description": "Articulated truck broken down across the narrow two-lane stretch. Traffic diverted onto single lane; heavy slow-moving queue bleeding into Ayetoro road.",
            "latitude": Decimal("7.168500"),
            "longitude": Decimal("3.324200"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["tunde_balogun"],
            "created_hours_ago": 1,
            "is_demo": False,
        },
        {
            "id": 4,
            "category": HazardCategory.FALLEN_TREE,
            "location_label": "Presidential Boulevard, Oke-Mosan",
            "description": "Large fallen tree branch obstructing the outer lane near the State Secretariat complex. Power lines appear clear, but traffic is swerving to avoid it.",
            "latitude": Decimal("7.135000"),
            "longitude": Decimal("3.348000"),
            "status": HazardStatus.UNDER_REVIEW,
            "reporter": seeded_users["amara_adebayo"],
            "created_hours_ago": 12,
            "is_demo": False,
        },
        {
            "id": 5,
            "category": HazardCategory.POTHOLE,
            "location_label": "Adatan Roundabout",
            "description": "Severely degraded asphalt section at the entry of the roundabout. Motorists forced into abrupt braking.",
            "latitude": Decimal("7.166100"),
            "longitude": Decimal("3.355100"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 24,
            "is_demo": False,
        },
        {
            "id": 6,
            "category": HazardCategory.FLOODING,
            "location_label": "IBB Boulevard near Kuto Bridge",
            "description": "Overflowing storm drain causing curb-height water accumulation on the descent from the bridge.",
            "latitude": Decimal("7.146500"),
            "longitude": Decimal("3.343500"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["chidi_okonkwo"],
            "created_hours_ago": 2,
            "is_demo": False,
        },
        {
            "id": 7,
            "category": HazardCategory.BLOCKED_ROAD,
            "location_label": "Sapon Hill Road",
            "description": "Heavy duty truck stalled on the steep incline leading to Sapon. Complete blockage of the ascending lane.",
            "latitude": Decimal("7.153900"),
            "longitude": Decimal("3.346500"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["amara_adebayo"],
            "created_hours_ago": 5,
            "is_demo": False,
        },
        {
            "id": 8,
            "category": HazardCategory.OTHER,
            "location_label": "Oke-Ilewo near OPIC Plaza",
            "description": "Missing heavy cast-iron manhole cover on the pedestrian walkway/edge of the road. Makeshift tire placed as temporary warning.",
            "latitude": Decimal("7.143200"),
            "longitude": Decimal("3.340200"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["tunde_balogun"],
            "created_hours_ago": 4,
            "is_demo": False,
        },
        {
            "id": 9,
            "category": HazardCategory.POTHOLE,
            "location_label": "Totoro Road",
            "description": "Deep depression at the intersection repaired by state road maintenance team (OGROMA). Surface is freshly asphalted and traffic flowing freely.",
            "latitude": Decimal("7.160100"),
            "longitude": Decimal("3.336100"),
            "status": HazardStatus.RESOLVED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 72,
            "is_demo": False,
        },
        {
            "id": 10,
            "category": HazardCategory.FALLEN_TREE,
            "location_label": "Ibara GRA",
            "description": "Fallen tree branch cleared by emergency public works crew. Roadway completely reopened.",
            "latitude": Decimal("7.138800"),
            "longitude": Decimal("3.330800"),
            "status": HazardStatus.RESOLVED,
            "reporter": seeded_users["chidi_okonkwo"],
            "created_hours_ago": 96,
            "is_demo": False,
        },
        {
            "id": 11,
            "category": HazardCategory.BLOCKED_ROAD,
            "location_label": "Quarry Road, Panseke",
            "description": "Report claimed complete road closure due to a student protest. Community members flagged that the roadway is actually open, just experiencing slow traffic.",
            "latitude": Decimal("7.145500"),
            "longitude": Decimal("3.334000"),
            "status": HazardStatus.UNDER_REVIEW,
            "reporter": seeded_users["tunde_balogun"],
            "created_hours_ago": 8,
            "is_demo": False,
        },
        {
            "id": 12,
            "category": HazardCategory.FLOODING,
            "location_label": "Ijaye Road by Gbangba",
            "description": "Flash flooding from choked culvert. Water rising along the roadside shops.",
            "latitude": Decimal("7.149500"),
            "longitude": Decimal("3.349900"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 1,
            "is_demo": False,
        },
        {
            "id": 13,
            "category": HazardCategory.FLOODING,
            "location_label": "Adigbe Bridge (Opako River Crossing)",
            "description": "Opako stream overflowed banks following torrential rain; 2 feet of moving water across Adigbe road. Sedans grounded, only high-clearance trucks passing.",
            "latitude": Decimal("7.126400"),
            "longitude": Decimal("3.328900"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["amara_adebayo"],
            "created_hours_ago": 2,
            "is_demo": False,
        },
        {
            "id": 14,
            "category": HazardCategory.POTHOLE,
            "location_label": "Asero-Abeokuta Old Ibadan Road",
            "description": "Series of sunken gullies and erosion cuts along the descent toward Osiele. Vehicles veering into opposite lanes to avoid suspension damage.",
            "latitude": Decimal("7.185200"),
            "longitude": Decimal("3.398000"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 18,
            "is_demo": False,
        },
        {
            "id": 15,
            "category": HazardCategory.BLOCKED_ROAD,
            "location_label": "Sagamu-Abeokuta Expressway (Kobape Interchange)",
            "description": "Overturned 30-tonne granite tipper spilling gravel across the inward Abeokuta corridor. TRACE and FRSC directing vehicles through diversion ramp.",
            "latitude": Decimal("7.078200"),
            "longitude": Decimal("3.421000"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["tunde_balogun"],
            "created_hours_ago": 4,
            "is_demo": False,
        },
        {
            "id": 16,
            "category": HazardCategory.OTHER,
            "location_label": "Panseke Pedestrian Overhead Bridge Foot",
            "description": "Exposed high-voltage underground cable trench left open after municipal fiber laying. Walking hazard for commuters boarding cabs.",
            "latitude": Decimal("7.143800"),
            "longitude": Decimal("3.332500"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["chidi_okonkwo"],
            "created_hours_ago": 7,
            "is_demo": False,
        },
        {
            "id": 17,
            "category": HazardCategory.POTHOLE,
            "location_label": "Lagos-Abeokuta Expressway (Itori/Ewekoro Axis)",
            "description": "Massive crater near cement truck depot causing complete stoppage and bumper-to-bumper queue extending back toward Papalanto.",
            "latitude": Decimal("6.931500"),
            "longitude": Decimal("3.218500"),
            "status": HazardStatus.COMMUNITY_CONFIRMED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 14,
            "is_demo": False,
        },
        {
            "id": 18,
            "category": HazardCategory.BLOCKED_ROAD,
            "location_label": "Ita-Oshin Roundabout by Ayetoro Park",
            "description": "Commercial bus broke an axle in middle of roundabout lane, snarling interstate trailers entering Abeokuta from Ibarapa corridor.",
            "latitude": Decimal("7.174200"),
            "longitude": Decimal("3.310800"),
            "status": HazardStatus.UNDER_REVIEW,
            "reporter": seeded_users["amara_adebayo"],
            "created_hours_ago": 5,
            "is_demo": False,
        },
        {
            "id": 19,
            "category": HazardCategory.FLOODING,
            "location_label": "Olomore Housing Estate Access Road",
            "description": "Blocked primary drainage causing mud runoff and knee-deep ponding across estate main gate. Community youth assisting stranded commuters.",
            "latitude": Decimal("7.181000"),
            "longitude": Decimal("3.337000"),
            "status": HazardStatus.REPORTED,
            "reporter": seeded_users["tunde_balogun"],
            "created_hours_ago": 1,
            "is_demo": False,
        },
        {
            "id": 20,
            "category": HazardCategory.POTHOLE,
            "location_label": "MKO Abiola Stadium Road, Kuto",
            "description": "Severe asphalt depression re-patched by OGROMA rapid response team ahead of state sporting festival. Surface is level and smooth.",
            "latitude": Decimal("7.141500"),
            "longitude": Decimal("3.345800"),
            "status": HazardStatus.RESOLVED,
            "reporter": seeded_users["citizen"],
            "created_hours_ago": 80,
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
    confirmations_plan = [
        # Report 1 (Kuto Flooding): 4 confirmations
        (1, [seeded_users["chidi_okonkwo"], seeded_users["amara_adebayo"], seeded_users["tunde_balogun"], seeded_users["moderator"]]),
        # Report 2 (Camp-Obantoko pothole): 5 confirmations
        (2, [seeded_users["citizen"], seeded_users["amara_adebayo"], seeded_users["tunde_balogun"], seeded_users["moderator"], seeded_users["admin"]]),
        # Report 5 (Adatan Roundabout pothole): 4 confirmations
        (5, [seeded_users["chidi_okonkwo"], seeded_users["amara_adebayo"], seeded_users["tunde_balogun"], seeded_users["moderator"]]),
        # Report 7 (Sapon Hill breakdown): 3 confirmations
        (7, [seeded_users["citizen"], seeded_users["chidi_okonkwo"], seeded_users["tunde_balogun"]]),
        # Report 13 (Adigbe Bridge flooding): 4 confirmations
        (13, [seeded_users["citizen"], seeded_users["chidi_okonkwo"], seeded_users["tunde_balogun"], seeded_users["moderator"]]),
        # Report 14 (Asero Road damage): 3 confirmations
        (14, [seeded_users["amara_adebayo"], seeded_users["chidi_okonkwo"], seeded_users["tunde_balogun"]]),
        # Report 15 (Kobape Interchange obstruction): 4 confirmations
        (15, [seeded_users["citizen"], seeded_users["amara_adebayo"], seeded_users["moderator"], seeded_users["admin"]]),
        # Report 17 (Itori / Ewekoro pothole): 3 confirmations
        (17, [seeded_users["tunde_balogun"], seeded_users["chidi_okonkwo"], seeded_users["amara_adebayo"]]),
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

    flags_plan = [
        # Report 11 (Quarry Road, Panseke): 2 flags -> queued in /moderation!
        (11, seeded_users["citizen"], "inaccurate", "Road is open, just standard Panseke commercial traffic."),
        (11, seeded_users["chidi_okonkwo"], "cleared", "I just drove through towards Omida, traffic is flowing normally."),
        # Report 4 (Oke-Mosan fallen tree): 1 flag
        (4, seeded_users["tunde_balogun"], "duplicate", "Similar obstruction reported earlier on this corridor."),
        # Report 18 (Ita-Oshin obstruction): cleared after intervention
        (18, seeded_users["citizen"], "cleared", "TRACE officers pushed the bus off into the dirt verge; roundabout lane is clear now."),
        # Report 16 (Panseke cable trench): inaccurate after safety barriers were added
        (16, seeded_users["amara_adebayo"], "inaccurate", "Contractors placed plastic reflective barriers around the trench an hour ago."),
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

    ModerationAction.objects.get_or_create(
        report=seeded_hazards[9],
        moderator=seeded_users["moderator"],
        action="resolve",
        defaults={
            "reason": "OGROMA road maintenance team confirmed asphalt resurfacing completed at Totoro intersection.",
            "created_at": now - timedelta(days=2),
        }
    )
    ModerationAction.objects.get_or_create(
        report=seeded_hazards[10],
        moderator=seeded_users["moderator"],
        action="resolve",
        defaults={
            "reason": "Public works branch clearance verified by community observers in Ibara GRA.",
            "created_at": now - timedelta(days=3),
        }
    )
    ModerationAction.objects.get_or_create(
        report=seeded_hazards[20],
        moderator=seeded_users["moderator"],
        action="resolve",
        defaults={
            "reason": "OGROMA rapid response team patched the depression along MKO Abiola Stadium axis.",
            "created_at": now - timedelta(days=3),
        }
    )
    print("  -> Logged historical moderation decisions in audit table")

    # 5. System Administrative Audit Logs
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

    # Synchronize PostgreSQL sequence counters so newly created records don't collide with seeded IDs
    from django.db import connection
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            cursor.execute("""
                DO $$
                DECLARE
                    r RECORD;
                    max_id BIGINT;
                BEGIN
                    FOR r IN (
                        SELECT c.relname AS table_name, a.attname AS column_name, s.relname AS seq_name
                        FROM pg_class s
                        JOIN pg_depend d ON d.objid = s.oid
                        JOIN pg_class c ON d.refobjid = c.oid
                        JOIN pg_attribute a ON (d.refobjid = a.attrelid AND d.refobjsubid = a.attnum)
                        WHERE s.relkind = 'S'
                    ) LOOP
                        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.column_name, r.table_name) INTO max_id;
                        IF max_id > 0 THEN
                            EXECUTE format('SELECT setval(%L, %s, false)', r.seq_name, max_id + 1);
                        END IF;
                    END LOOP;
                END $$;
            """)
        print("  -> PostgreSQL sequence counters synchronized")

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
