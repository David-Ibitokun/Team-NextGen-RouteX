from django.contrib import admin
from .models import HazardReport, Confirmation, HazardFlag

@admin.register(HazardReport)
class HazardReportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "category",
        "location_label",
        "status",
        "confirmations_count",
        "flags_count",
        "is_demo",
        "created_at",
    )
    list_filter = ("category", "status", "is_demo", "created_at")
    search_fields = ("location_label", "description")
    readonly_fields = ("created_at", "updated_at", "confirmations_count", "flags_count")

@admin.register(Confirmation)
class ConfirmationAdmin(admin.ModelAdmin):
    list_display = ("id", "report", "user", "created_at")
    list_filter = ("created_at",)

@admin.register(HazardFlag)
class HazardFlagAdmin(admin.ModelAdmin):
    list_display = ("id", "report", "reason", "status", "created_at")
    list_filter = ("reason", "status", "created_at")
