-- ========================================================
-- RouteX Database Seed Script (Team NextGen)
-- Compatible with SQLite and PostgreSQL
-- Includes: 3 User Types (Admin, Moderator, Citizen),
--           Hazards, Confirmations, Flags, Moderation Actions
-- ========================================================

-- --------------------------------------------------------
-- Table: auth_user
-- --------------------------------------------------------
INSERT INTO auth_user ("id", "password", "last_login", "is_superuser", "username", "last_name", "email", "is_staff", "is_active", "date_joined", "first_name") VALUES (1, 'pbkdf2_sha256$870000$8e44L5lEHzpk7WBdLFlkKj$5/IhsBB3i0Q6Yh34R6IHVw5VCdQn9iaTlUgHpc1GyWk=', NULL, 1, 'admin', '', 'admin@routex.org', 1, 1, '2026-10-17 00:19:51.432563', '');
INSERT INTO auth_user ("id", "password", "last_login", "is_superuser", "username", "last_name", "email", "is_staff", "is_active", "date_joined", "first_name") VALUES (2, 'pbkdf2_sha256$870000$nZA7i1aVPnCNwlqDTzB0ec$P4irtl3Ac5txoFh+HPW4fh8CX83t97hvBMLbi5196n0=', NULL, 0, 'moderator', '', 'moderator@routex.org', 1, 1, '2026-10-17 00:19:53.612151', '');
INSERT INTO auth_user ("id", "password", "last_login", "is_superuser", "username", "last_name", "email", "is_staff", "is_active", "date_joined", "first_name") VALUES (3, 'pbkdf2_sha256$870000$Glq1LiC8UvsGCjVlqgUSO1$Pk9ze6XoBMMzyZxzVSOHwJD/mRTz8tX412Yyfhv0D6Y=', NULL, 0, 'citizen', '', 'citizen@routex.org', 0, 1, '2026-10-17 00:19:55.298228', '');
INSERT INTO auth_user ("id", "password", "last_login", "is_superuser", "username", "last_name", "email", "is_staff", "is_active", "date_joined", "first_name") VALUES (4, 'pbkdf2_sha256$870000$yM7E9K3fQCZ6JbzxGztqr4$J4gWsfSLZD8vNIHlvXRXPt+CkdmNzBih/pgcCOwaQ3c=', NULL, 0, 'chidi_okonkwo', '', 'chidi@routex.org', 0, 1, '2026-10-17 00:19:57.154635', '');
INSERT INTO auth_user ("id", "password", "last_login", "is_superuser", "username", "last_name", "email", "is_staff", "is_active", "date_joined", "first_name") VALUES (5, 'pbkdf2_sha256$870000$f2AX7tef9esejUEcaVottj$oKyRElEOfKb+JZCEsO5D5xM2kQeH2he45AJZ2HiiGBM=', NULL, 0, 'amara_adebayo', '', 'amara@routex.org', 0, 1, '2026-10-17 00:19:58.507681', '');
INSERT INTO auth_user ("id", "password", "last_login", "is_superuser", "username", "last_name", "email", "is_staff", "is_active", "date_joined", "first_name") VALUES (6, 'pbkdf2_sha256$870000$RWpta8Vx7TKXLIvhx4Zhlc$arh8I4Tc2HbOoobRycSrsGHSJR4dUnAXo0VUSmrH4Q8=', NULL, 0, 'tunde_balogun', '', 'tunde@routex.org', 0, 1, '2026-10-17 00:20:01.016645', '');

-- --------------------------------------------------------
-- Table: accounts_userprofile
-- --------------------------------------------------------
INSERT INTO accounts_userprofile ("id", "display_name", "role", "created_at", "updated_at", "user_id") VALUES (1, 'System Administrator', 'admin', '2026-10-17 00:19:53.583423', '2026-10-17 00:19:53.592363', 1);
INSERT INTO accounts_userprofile ("id", "display_name", "role", "created_at", "updated_at", "user_id") VALUES (2, 'Trust & Safety Moderator', 'moderator', '2026-10-17 00:19:55.247110', '2026-10-17 00:19:55.262835', 2);
INSERT INTO accounts_userprofile ("id", "display_name", "role", "created_at", "updated_at", "user_id") VALUES (3, 'Active Commuter', 'citizen', '2026-10-17 00:19:57.138877', '2026-10-17 00:19:57.146035', 3);
INSERT INTO accounts_userprofile ("id", "display_name", "role", "created_at", "updated_at", "user_id") VALUES (4, 'Chidi Okonkwo', 'citizen', '2026-10-17 00:19:58.494063', '2026-10-17 00:19:58.500592', 4);
INSERT INTO accounts_userprofile ("id", "display_name", "role", "created_at", "updated_at", "user_id") VALUES (5, 'Amara Adebayo', 'citizen', '2026-10-17 00:20:00.991932', '2026-10-17 00:20:01.001759', 5);
INSERT INTO accounts_userprofile ("id", "display_name", "role", "created_at", "updated_at", "user_id") VALUES (6, 'Tunde Balogun', 'citizen', '2026-10-17 00:20:03.442570', '2026-10-17 00:20:03.453872', 6);

-- --------------------------------------------------------
-- Table: accounts_platformsettings
-- --------------------------------------------------------
INSERT INTO accounts_platformsettings ("id", "confirmation_threshold", "freshness_hours", "max_upload_size_mb", "allow_anonymous_map_view", "emergency_notice_enabled", "updated_at", "updated_by_id") VALUES (1, 3, 48, 5, 1, 1, '2026-10-17 00:19:51.418964', NULL);

-- --------------------------------------------------------
-- Table: hazards_hazardreport
-- --------------------------------------------------------
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (1, 'flooding', 'Lekki-Epe Expressway by Jakande Roundabout', 'Deep standing flood water extending across the right two lanes after heavy downpour. Impassable for sedans; causing severe bottleneck toward Victoria Island.', 6.4385, 3.5132, 'community_confirmed', '', 4, 0, 0, '2026-10-16 21:19:51.393121', '2026-10-16 21:19:51.393121', 3);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (2, 'pothole', 'Third Mainland Bridge (Adekunle Inward Ramp)', 'Cluster of three sharp crater potholes right at the crest of the off-ramp curve. Poses severe blowout hazard to unaware motorists at speed.', 6.4952, 3.3891, 'community_confirmed', '', 5, 0, 0, '2026-10-16 18:19:51.393121', '2026-10-16 18:19:51.393121', 4);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (3, 'blocked_road', 'Apapa-Oshodi Expressway near Mile 2 Flyover', 'Articulated container truck broken down across service lane. Traffic diverted onto single inner lane; heavy slow-moving queue.', 6.4678, 3.3214, 'reported', '', 6, 0, 0, '2026-10-16 23:19:51.393121', '2026-10-16 23:19:51.393121', 6);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (4, 'fallen_tree', 'Alfred Rewane Road (Kingsway), Ikoyi', 'Large fallen mahogany branch obstructing pedestrian walkway and outer motor lane near Golden Gate restaurant. Power lines clear.', 6.4521, 3.4428, 'under_review', '', 1, 1, 0, '2026-10-16 12:19:51.393121', '2026-10-16 12:19:51.393121', 5);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (5, 'pothole', 'Ikorodu Road by Maryland Interchange', 'Severely degraded asphalt section with exposed iron reinforcement mesh. Motorists forced into abrupt braking.', 6.5721, 3.3684, 'community_confirmed', '', 4, 0, 0, '2026-10-16 00:19:51.393121', '2026-10-16 00:19:51.393121', 3);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (6, 'flooding', 'Ozumba Mbadiwe Avenue near Civic Centre, Victoria Island', 'Overflowing storm drain causing curb-height water accumulation on both sides of the dual carriageway.', 6.4312, 3.4243, 'reported', '', 0, 0, 0, '2026-10-16 22:19:51.393121', '2026-10-16 22:19:51.393121', 4);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (7, 'blocked_road', 'Lagos-Ibadan Expressway near Kara Cattle Market', 'Multiple stalled heavy haulage vehicles causing extensive backup past the Berger outward bridge.', 6.6489, 3.3982, 'community_confirmed', '', 3, 0, 0, '2026-10-16 19:19:51.393121', '2026-10-16 19:19:51.393121', 5);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (8, 'other', 'Broad Street, Lagos Island Central', 'Missing heavy cast-iron manhole cover in the center lane. Makeshift tree branch placed as temporary warning.', 6.4539, 3.3923, 'reported', '', 0, 0, 0, '2026-10-16 20:19:51.393121', '2026-10-16 20:19:51.393121', 6);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (9, 'pothole', 'Ahmadu Bello Way by Bar Beach, Victoria Island', 'Deep depression at intersection repaired by road maintenance team. Surface is freshly asphalted and traffic flowing freely.', 6.4258, 3.419, 'resolved', '', 0, 0, 0, '2026-10-14 00:19:51.393121', '2026-10-14 00:19:51.393121', 3);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (10, 'fallen_tree', 'Bourdillon Road, Ikoyi', 'Fallen tree branch cleared by emergency public works crew. Roadway completely reopened.', 6.4495, 3.451, 'resolved', '', 0, 0, 0, '2026-10-13 00:19:51.393121', '2026-10-13 00:19:51.393121', 4);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (11, 'blocked_road', 'Herbert Macaulay Way by Sabo Yaba', 'Report claimed complete road closure due to private event. Community members flagged that roadway is actually open.', 6.5082, 3.3771, 'under_review', '', 0, 2, 0, '2026-10-16 16:19:51.393121', '2026-10-16 16:19:51.393121', 6);
INSERT INTO hazards_hazardreport ("id", "category", "location_label", "description", "latitude", "longitude", "status", "photo", "confirmations_count", "flags_count", "is_demo", "created_at", "updated_at", "reporter_id") VALUES (12, 'flooding', 'Agege Motor Road near Oshodi Interchange', 'Flash flooding from choked culvert. Water rising along railway corridor approach.', 6.538, 3.352, 'reported', '', 0, 0, 0, '2026-10-16 23:19:51.393121', '2026-10-16 23:19:51.393121', 3);

-- --------------------------------------------------------
-- Table: hazards_confirmation
-- --------------------------------------------------------
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (1, '', '2026-10-17 00:20:03.716077', 4, 1);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (2, '', '2026-10-17 00:20:03.725738', 5, 1);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (3, '', '2026-10-17 00:20:03.737093', 6, 1);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (4, '', '2026-10-17 00:20:03.756819', 2, 1);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (5, '', '2026-10-17 00:20:03.776891', 3, 2);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (6, '', '2026-10-17 00:20:03.789083', 5, 2);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (7, '', '2026-10-17 00:20:03.798436', 6, 2);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (8, '', '2026-10-17 00:20:03.811989', 2, 2);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (9, '', '2026-10-17 00:20:03.824386', 1, 2);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (10, '', '2026-10-17 00:20:03.856771', 4, 5);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (11, '', '2026-10-17 00:20:03.868951', 5, 5);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (12, '', '2026-10-17 00:20:03.878601', 6, 5);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (13, '', '2026-10-17 00:20:03.888329', 2, 5);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (14, '', '2026-10-17 00:20:03.908019', 3, 7);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (15, '', '2026-10-17 00:20:03.917824', 4, 7);
INSERT INTO hazards_confirmation ("id", "session_key", "created_at", "user_id", "report_id") VALUES (16, '', '2026-10-17 00:20:03.937648', 6, 7);

-- --------------------------------------------------------
-- Table: hazards_hazardflag
-- --------------------------------------------------------
INSERT INTO hazards_hazardflag ("id", "reason", "notes", "status", "created_at", "reporter_id", "report_id") VALUES (1, 'inaccurate', 'Road is open, only the service parking lane is restricted.', 'pending', '2026-10-17 00:20:03.958920', 3, 11);
INSERT INTO hazards_hazardflag ("id", "reason", "notes", "status", "created_at", "reporter_id", "report_id") VALUES (2, 'cleared', 'I just drove through Sabo Yaba, traffic is flowing normally.', 'pending', '2026-10-17 00:20:03.983633', 4, 11);
INSERT INTO hazards_hazardflag ("id", "reason", "notes", "status", "created_at", "reporter_id", "report_id") VALUES (3, 'duplicate', 'Similar obstruction reported earlier on this corridor.', 'pending', '2026-10-17 00:20:04.005429', 6, 4);

-- --------------------------------------------------------
-- Table: moderation_moderationaction
-- --------------------------------------------------------
INSERT INTO moderation_moderationaction ("id", "action", "reason", "created_at", "moderator_id", "report_id") VALUES (1, 'resolve', 'Road maintenance team confirmed asphalt resurfacing completed at Bar Beach intersection.', '2026-10-17 00:20:04.025569', 2, 9);
INSERT INTO moderation_moderationaction ("id", "action", "reason", "created_at", "moderator_id", "report_id") VALUES (2, 'resolve', 'Public works branch clearance verified by community observers.', '2026-10-17 00:20:04.038677', 2, 10);

-- --------------------------------------------------------
-- Table: accounts_systemauditlog
-- --------------------------------------------------------
INSERT INTO accounts_systemauditlog ("id", "action_type", "target_id", "details", "created_at", "actor_id") VALUES (1, 'SETTINGS_UPDATE', 'settings:1', 'Initialized operational settings: confirmation_threshold=3, freshness_hours=48, max_upload_size_mb=5', '2026-10-17 00:20:04.051764', 1);
INSERT INTO accounts_systemauditlog ("id", "action_type", "target_id", "details", "created_at", "actor_id") VALUES (2, 'ROLE_CHANGE', '2', 'Promoted user @moderator from citizen to moderator role for trust and safety review duty.', '2026-10-17 00:20:04.062090', 1);
