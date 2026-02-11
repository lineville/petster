"""Rescue organization endpoints.

Rescues upload a dog photo which is analyzed by Azure AI Vision to
auto-detect breed, color, coat, and size. A new dog record is created
with the pre-filled fields so the rescue only needs to fill in the
remaining details (name, age, temperament flags, etc.).
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dog, SexEnum
from app.schemas import RescueImageUploadResponse, DogOut, VisionAnalysisResult
from app.services.azure_vision import analyze_dog_image

router = APIRouter(prefix="/rescue", tags=["Rescue"])

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=RescueImageUploadResponse, status_code=201)
async def upload_dog_image(
    image: UploadFile = File(..., description="Photo of the dog"),
    name: str = Form(default="Unknown", description="Dog's name (if known)"),
    age_years: float = Form(default=1.0, description="Estimated age in years"),
    weight_lbs: float = Form(default=0.0, description="Estimated weight in lbs"),
    sex: SexEnum = Form(default=SexEnum.male, description="Dog's sex"),
    is_rescue: bool = Form(default=True),
    good_with_cats: bool = Form(default=False),
    good_with_kids: bool = Form(default=False),
    db: Session = Depends(get_db),
):
    """Upload a dog image for Azure AI Vision analysis.

    The image is analyzed to extract breed, color, size, and coat length.
    A new dog record is created with the AI-detected fields pre-filled.
    Rescues can later PATCH the record to correct any details.

    **Form fields** let the rescue supply info they already know (name,
    age, weight, temperament flags). Everything else is inferred from the
    image.
    """
    # Validate content type
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are supported.",
        )

    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image exceeds 10 MB limit.")

    # ── Analyze with Azure AI Vision ─────────────────────────────────────
    analysis: VisionAnalysisResult = await analyze_dog_image(image_bytes)

    # ── Create the dog record ────────────────────────────────────────────
    dog = Dog(
        name=name,
        breed=analysis.breed or "Mixed Breed",
        size=analysis.size,
        age_years=age_years,
        weight_lbs=weight_lbs if weight_lbs > 0 else _default_weight(analysis.size),
        color=analysis.color or "Unknown",
        description=analysis.description,
        sex=sex,
        coat_length=analysis.coat_length,
        is_rescue=is_rescue,
        good_with_cats=good_with_cats,
        good_with_kids=good_with_kids,
        image_url=None,  # Could store in blob storage in production
    )
    db.add(dog)
    db.commit()
    db.refresh(dog)

    return RescueImageUploadResponse(
        dog=DogOut.model_validate(dog),
        vision_analysis=analysis,
        message=(
            f"Dog analyzed with {analysis.confidence:.0%} confidence. "
            "Review the pre-filled fields and PATCH /dogs/{id} to correct anything."
        ),
    )


def _default_weight(size) -> float:
    """Fallback weight when the rescue doesn't provide one."""
    from app.models import SizeEnum

    return {
        SizeEnum.small: 15.0,
        SizeEnum.medium: 40.0,
        SizeEnum.large: 70.0,
        SizeEnum.extra_large: 110.0,
    }.get(size, 40.0)
