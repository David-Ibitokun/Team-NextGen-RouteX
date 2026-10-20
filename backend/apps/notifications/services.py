import logging
from typing import Optional, List, Dict, Any
from django.contrib.auth.models import User
from apps.notifications.models import Notification, NotificationType, DevicePushToken

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


class NotificationService:
    @staticmethod
    def send_notification(
        recipient: User,
        notification_type: str,
        title: str,
        body: str,
        target_hazard=None,
        sender: Optional[User] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Notification:
        """
        Creates and saves a notification record in the database,
        then dispatches a mobile push alert if active device tokens exist.
        """
        notification = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            title=title,
            body=body,
            target_hazard=target_hazard,
            metadata=metadata or {},
        )

        # Dispatch push notification to registered devices asynchronously/gracefully
        try:
            tokens = list(
                DevicePushToken.objects.filter(
                    user=recipient, is_active=True
                ).values_list("token", flat=True)
            )
            if tokens:
                push_data = {
                    "notification_id": notification.id,
                    "type": notification_type,
                    "target_hazard_id": target_hazard.id if target_hazard else None,
                    **(metadata or {}),
                }
                NotificationService._dispatch_expo_push(
                    tokens=tokens,
                    title=title,
                    body=body,
                    data=push_data,
                )
        except Exception as e:
            logger.warning(f"Error checking device push tokens for user {recipient.id}: {e}")

        return notification

    @staticmethod
    def notify_hazard_reported(report, user: Optional[User]) -> Optional[Notification]:
        """Send receipt notification when an authenticated user submits a hazard report."""
        if not user or not user.is_authenticated:
            return None

        cat = report.get_category_display()
        loc = report.location_label or "the reported location"
        return NotificationService.send_notification(
            recipient=user,
            notification_type=NotificationType.HAZARD_REPORTED,
            title="Hazard Report Active",
            body=f"Your report for {cat} at {loc} has been broadcast to RouteX commuters.",
            target_hazard=report,
            metadata={"category": report.category, "location": loc},
        )

    @staticmethod
    def notify_hazard_confirmed(report, confirmed_by: Optional[User]) -> Optional[Notification]:
        """Notify original reporter when another user confirms their hazard report."""
        if not report.reporter:
            return None

        # Do not notify if the user confirmed their own report
        if confirmed_by and report.reporter_id == confirmed_by.id:
            return None

        cat = report.get_category_display()
        loc = report.location_label or "your reported location"
        return NotificationService.send_notification(
            recipient=report.reporter,
            sender=confirmed_by,
            notification_type=NotificationType.HAZARD_CONFIRMED,
            title="Hazard Confirmed by Commuter",
            body=f"A commuter verified your {cat} report at {loc} (+5 Trust Points). Total confirmations: {report.confirmations_count}.",
            target_hazard=report,
            metadata={
                "confirmations_count": report.confirmations_count,
                "category": report.category,
                "location": loc,
            },
        )

    @staticmethod
    def notify_hazard_verified_milestone(report) -> Optional[Notification]:
        """Notify reporter when report reaches community verified milestone threshold."""
        if not report.reporter:
            return None

        cat = report.get_category_display()
        loc = report.location_label or "your reported location"
        return NotificationService.send_notification(
            recipient=report.reporter,
            notification_type=NotificationType.STATUS_CHANGED,
            title="Hazard Community Verified! 🌟",
            body=f"Your {cat} report at {loc} reached {report.confirmations_count} confirmations and is now officially Community Confirmed.",
            target_hazard=report,
            metadata={"status": report.status, "confirmations_count": report.confirmations_count},
        )

    @staticmethod
    def notify_hazard_status_changed(
        report,
        old_status: str,
        new_status: str,
        reason: str = "",
        moderator: Optional[User] = None,
    ) -> Optional[Notification]:
        """Notify reporter when report status changes via moderator action or resolution."""
        if not report.reporter:
            return None

        status_titles = {
            "resolved": "Hazard Marked Resolved ✅",
            "under_review": "Hazard Under Moderator Review 🔍",
            "rejected": "Hazard Report Update ⚠️",
            "community_confirmed": "Hazard Community Confirmed 🌟",
        }
        title = status_titles.get(new_status, f"Hazard Status: {new_status.replace('_', ' ').title()}")
        cat = report.get_category_display()
        loc = report.location_label or "your reported location"

        body = f"Your {cat} report at {loc} has been marked as {new_status.replace('_', ' ')}."
        if reason:
            body += f" Note: {reason}"

        return NotificationService.send_notification(
            recipient=report.reporter,
            sender=moderator,
            notification_type=NotificationType.STATUS_CHANGED,
            title=title,
            body=body,
            target_hazard=report,
            metadata={
                "old_status": old_status,
                "new_status": new_status,
                "reason": reason,
            },
        )

    @staticmethod
    def notify_moderators_flagged(report, flag) -> List[Notification]:
        """Notify active staff and moderators when a hazard report receives a community flag."""
        from django.db.models import Q

        # Find all staff, superusers, or users with moderator/admin role in UserProfile
        moderator_users = User.objects.filter(
            Q(is_staff=True) |
            Q(is_superuser=True) |
            Q(profile__role__in=["moderator", "admin"])
        ).distinct()

        created_notifications = []
        cat = report.get_category_display()
        loc = report.location_label or f"({report.latitude}, {report.longitude})"
        reason_display = getattr(flag, "get_reason_display", lambda: flag.reason)()

        for mod in moderator_users:
            # Don't notify the flag submitter if they happen to be staff
            if flag.reporter and flag.reporter_id == mod.id:
                continue

            notif = NotificationService.send_notification(
                recipient=mod,
                sender=flag.reporter,
                notification_type=NotificationType.HAZARD_FLAGGED,
                title=f"Flagged Hazard: {cat}",
                body=f"Report #{report.id} at {loc} was flagged for '{reason_display}'. Review required.",
                target_hazard=report,
                metadata={
                    "flag_id": flag.id,
                    "reason": flag.reason,
                    "notes": flag.notes,
                },
            )
            created_notifications.append(notif)

        return created_notifications

    @staticmethod
    def broadcast_safety_advisory(
        corridor: str,
        title: str,
        message: str,
        author: Optional[User] = None,
    ) -> int:
        """
        Broadcasts a corridor or city-wide safety advisory notification to all active users.
        Returns the count of created notifications.
        """
        active_users = User.objects.filter(is_active=True)
        notifications_to_create = []

        formatted_title = f"Safety Advisory: {corridor}" if corridor else title

        for u in active_users:
            notifications_to_create.append(
                Notification(
                    recipient=u,
                    sender=author,
                    notification_type=NotificationType.SAFETY_ADVISORY,
                    title=formatted_title,
                    body=message,
                    metadata={"corridor": corridor},
                )
            )

        created = Notification.objects.bulk_create(notifications_to_create, batch_size=500)

        # Dispatch push notification to all active registered devices
        try:
            tokens = list(
                DevicePushToken.objects.filter(is_active=True).values_list("token", flat=True)
            )
            if tokens:
                NotificationService._dispatch_expo_push(
                    tokens=tokens,
                    title=formatted_title,
                    body=message,
                    data={"corridor": corridor, "type": "safety_advisory"},
                )
        except Exception as e:
            logger.warning(f"Error dispatching broadcast push: {e}")

        return len(created)

    @staticmethod
    def _dispatch_expo_push(
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Delivers push notifications to Expo Push Service.
        Executes gracefully with timeout so failures never block the main request thread.
        """
        if not tokens:
            return

        import requests

        # Format Expo messages (Expo supports batches up to 100 messages)
        messages = []
        for token in tokens:
            if not token or not token.startswith("ExponentPushToken"):
                continue
            messages.append({
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data or {},
                "priority": "high",
            })

        if not messages:
            return

        try:
            # Chunk into batches of 100
            for i in range(0, len(messages), 100):
                batch = messages[i:i + 100]
                resp = requests.post(
                    EXPO_PUSH_URL,
                    json=batch,
                    headers={
                        "Accept": "application/json",
                        "Accept-encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                    timeout=4.0,
                )
                if resp.status_code != 200:
                    logger.warning(f"Expo push API returned status {resp.status_code}: {resp.text}")
        except Exception as err:
            logger.warning(f"Failed to deliver Expo push notification: {err}")
