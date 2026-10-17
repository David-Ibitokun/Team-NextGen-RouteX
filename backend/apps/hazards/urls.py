from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HazardReportViewSet

router = DefaultRouter()
router.register(r"", HazardReportViewSet, basename="hazard")

urlpatterns = [
    path("", include(router.urls)),
]
