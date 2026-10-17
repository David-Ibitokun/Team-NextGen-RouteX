import io
import os
from PIL import Image
from django.core.files.base import ContentFile


def convert_image_to_webp(image_field, max_size=(1600, 1600), quality=82):
    """
    Converts an uploaded photo to a lightweight, high-quality WebP format.
    Downscales images exceeding max_size while preserving aspect ratio.
    Reduces file size dramatically (typically 80-95%) with no visible quality loss.
    """
    if not image_field:
        return image_field

    try:
        if hasattr(image_field, "seek"):
            image_field.seek(0)
        img = Image.open(image_field)

        # Scale down if either dimension exceeds max_size
        if img.width > max_size[0] or img.height > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Handle color modes
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            converted = img.convert("RGBA")
        else:
            converted = img.convert("RGB")

        # Save to WebP in memory
        buffer = io.BytesIO()
        converted.save(buffer, format="WEBP", quality=quality, method=6)
        buffer.seek(0)

        raw_name = getattr(image_field, "name", "hazard_photo") or "hazard_photo"
        base_name = os.path.splitext(os.path.basename(raw_name))[0] or "hazard"
        new_filename = f"{base_name}.webp"

        return ContentFile(buffer.getvalue(), name=new_filename)
    except Exception:
        # Fallback to original file if processing encounters any error
        if hasattr(image_field, "seek"):
            image_field.seek(0)
        return image_field
