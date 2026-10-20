from django.urls import path
from apps.notifications import views

urlpatterns = [
    path("", views.notifications_list, name="notifications-list"),
    path("unread-count/", views.notifications_unread_count, name="notifications-unread-count"),
    path("mark-all-read/", views.notifications_mark_all_read, name="notifications-mark-all-read"),
    path("devices/", views.device_token_register, name="notifications-device-register"),
    path("broadcast/", views.broadcast_advisory, name="notifications-broadcast"),
    path("<int:pk>/read/", views.notification_mark_read, name="notification-mark-read"),
    path("<int:pk>/", views.notification_delete, name="notification-delete"),
]
