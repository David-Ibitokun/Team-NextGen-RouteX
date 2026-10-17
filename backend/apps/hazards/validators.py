from decimal import Decimal
from django.core.exceptions import ValidationError
from django.conf import settings
from PIL import Image

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

def validate_latitude(value):
    """Latitude must be between -90.0 and 90.0."""
    try:
        val = Decimal(str(value))
    except Exception:
        raise ValidationError("Latitude must be a valid decimal number.")
    if val < Decimal("-90.0") or val > Decimal("90.0"):
        raise ValidationError("Latitude must be between -90.0 and 90.0 degrees.")

def validate_longitude(value):
    """Longitude must be between -180.0 and 180.0."""
    try:
        val = Decimal(str(value))
    except Exception:
        raise ValidationError("Longitude must be a valid decimal number.")
    if val < Decimal("-180.0") or val > Decimal("180.0"):
        raise ValidationError("Longitude must be between -180.0 and 180.0 degrees.")

def validate_hazard_photo(file_obj):
    """Validate photo file size and file format."""
    max_mb = getattr(settings, "MAX_UPLOAD_SIZE_MB", 5)
    max_bytes = max_mb * 1024 * 1024
    if file_obj.size > max_bytes:
        raise ValidationError(f"Photo file size cannot exceed {max_mb} MB.")

    ext = file_obj.name.split(".")[-1].lower() if "." in file_obj.name else ""
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file format '.{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}."
        )

    # Validate that it is indeed a readable image using Pillow
    try:
        image = Image.open(file_obj)
        image.verify()
    except Exception:
        raise ValidationError("The uploaded file is not a valid or readable image.")
    finally:
        # Reset file pointer after reading header
        if hasattr(file_obj, "seek"):
            file_obj.seek(0)
