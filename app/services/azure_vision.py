"""Azure AI Vision integration for analyzing dog images.

Uses the Azure AI Vision Image Analysis API (4.0) to identify dog
breed, color, size hints, and coat description from an uploaded photo.
"""

import httpx
import logging
from typing import Optional
from app.config import get_settings
from app.schemas import VisionAnalysisResult
from app.models import SizeEnum, CoatLengthEnum

logger = logging.getLogger(__name__)

# ── Breed → size / coat heuristic look-ups ───────────────────────────────────

BREED_SIZE_MAP: dict[str, SizeEnum] = {
    "golden retriever": SizeEnum.large,
    "labrador retriever": SizeEnum.large,
    "german shepherd": SizeEnum.large,
    "french bulldog": SizeEnum.small,
    "beagle": SizeEnum.medium,
    "poodle": SizeEnum.medium,
    "rottweiler": SizeEnum.extra_large,
    "australian shepherd": SizeEnum.medium,
    "boxer": SizeEnum.large,
    "yorkshire terrier": SizeEnum.small,
    "siberian husky": SizeEnum.large,
    "dachshund": SizeEnum.small,
    "bernese mountain dog": SizeEnum.extra_large,
    "shih tzu": SizeEnum.small,
    "great dane": SizeEnum.extra_large,
    "pit bull": SizeEnum.medium,
    "corgi": SizeEnum.small,
    "doberman": SizeEnum.large,
    "chihuahua": SizeEnum.small,
    "border collie": SizeEnum.medium,
    "bulldog": SizeEnum.medium,
    "cocker spaniel": SizeEnum.medium,
    "maltese": SizeEnum.small,
    "pomeranian": SizeEnum.small,
    "cavalier king charles spaniel": SizeEnum.small,
}

BREED_COAT_MAP: dict[str, CoatLengthEnum] = {
    "golden retriever": CoatLengthEnum.long,
    "labrador retriever": CoatLengthEnum.short,
    "german shepherd": CoatLengthEnum.medium,
    "french bulldog": CoatLengthEnum.short,
    "beagle": CoatLengthEnum.short,
    "poodle": CoatLengthEnum.long,
    "rottweiler": CoatLengthEnum.short,
    "australian shepherd": CoatLengthEnum.long,
    "boxer": CoatLengthEnum.short,
    "yorkshire terrier": CoatLengthEnum.long,
    "siberian husky": CoatLengthEnum.long,
    "dachshund": CoatLengthEnum.short,
    "bernese mountain dog": CoatLengthEnum.long,
    "shih tzu": CoatLengthEnum.long,
    "great dane": CoatLengthEnum.short,
    "pit bull": CoatLengthEnum.short,
    "corgi": CoatLengthEnum.medium,
    "doberman": CoatLengthEnum.short,
    "chihuahua": CoatLengthEnum.short,
    "border collie": CoatLengthEnum.medium,
    "bulldog": CoatLengthEnum.short,
    "cocker spaniel": CoatLengthEnum.medium,
    "maltese": CoatLengthEnum.long,
    "pomeranian": CoatLengthEnum.long,
    "cavalier king charles spaniel": CoatLengthEnum.medium,
}


def _lookup_size(breed: str) -> Optional[SizeEnum]:
    breed_lower = breed.lower()
    for key, val in BREED_SIZE_MAP.items():
        if key in breed_lower:
            return val
    return None


def _lookup_coat(breed: str) -> Optional[CoatLengthEnum]:
    breed_lower = breed.lower()
    for key, val in BREED_COAT_MAP.items():
        if key in breed_lower:
            return val
    return None


async def analyze_dog_image(image_bytes: bytes) -> VisionAnalysisResult:
    """Send an image to Azure AI Vision and return pre-filled dog attributes.

    Uses the Azure AI Vision 4.0 Image Analysis API with the
    'caption,tags,objects' visual features to extract breed / color info.

    If Azure credentials are not configured, returns a mock result so the
    API stays functional during local development.
    """
    settings = get_settings()

    # ── Fallback mock when Azure is not configured ───────────────────────
    if not settings.azure_vision_endpoint or not settings.azure_vision_key:
        logger.warning(
            "Azure Vision credentials not set – returning mock analysis."
        )
        return VisionAnalysisResult(
            breed="Mixed Breed",
            size=SizeEnum.medium,
            color="Brown",
            coat_length=CoatLengthEnum.medium,
            description="A friendly-looking dog waiting for analysis (Azure Vision not configured).",
            confidence=0.0,
        )

    # ── Call Azure AI Vision Image Analysis 4.0 ──────────────────────────
    endpoint = settings.azure_vision_endpoint.rstrip("/")
    url = f"{endpoint}/computervision/imageanalysis:analyze"
    params = {
        "api-version": "2024-02-01",
        "features": "caption,tags,objects",
        "language": "en",
    }
    headers = {
        "Ocp-Apim-Subscription-Key": settings.azure_vision_key,
        "Content-Type": "application/octet-stream",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            url, params=params, headers=headers, content=image_bytes
        )
        response.raise_for_status()
        data = response.json()

    # ── Parse the response ───────────────────────────────────────────────
    caption_text: str = ""
    confidence: float = 0.0
    if "captionResult" in data:
        caption_text = data["captionResult"].get("text", "")
        confidence = data["captionResult"].get("confidence", 0.0)

    tags: list[str] = [
        t["name"] for t in data.get("tagsResult", {}).get("values", [])
    ]
    objects_detected: list[str] = [
        o["tags"][0]["name"]
        for o in data.get("objectsResult", {}).get("values", [])
        if o.get("tags")
    ]

    # Try to find a breed from tags / objects / caption
    breed = _extract_breed(tags, objects_detected, caption_text)
    color = _extract_color(tags, caption_text)
    size = _lookup_size(breed) if breed else None
    coat_length = _lookup_coat(breed) if breed else None

    description = caption_text or "A dog detected by Azure AI Vision."

    return VisionAnalysisResult(
        breed=breed or "Mixed Breed",
        size=size or SizeEnum.medium,
        color=color or "Unknown",
        coat_length=coat_length or CoatLengthEnum.medium,
        description=description,
        confidence=round(confidence, 3),
    )


# ── Helpers ──────────────────────────────────────────────────────────────────

# Common breed keywords that might appear in Azure tags / captions
_KNOWN_BREEDS = list(BREED_SIZE_MAP.keys())

_COLOR_KEYWORDS = [
    "black",
    "white",
    "brown",
    "golden",
    "tan",
    "red",
    "gray",
    "grey",
    "cream",
    "brindle",
    "merle",
    "spotted",
    "fawn",
    "chocolate",
    "blue",
    "tricolor",
]


def _extract_breed(
    tags: list[str], objects: list[str], caption: str
) -> Optional[str]:
    """Try to match a known breed from Vision output."""
    combined = " ".join(tags + objects).lower() + " " + caption.lower()
    for breed in _KNOWN_BREEDS:
        if breed in combined:
            return breed.title()
    return None


def _extract_color(tags: list[str], caption: str) -> Optional[str]:
    combined = " ".join(tags).lower() + " " + caption.lower()
    for color in _COLOR_KEYWORDS:
        if color in combined:
            return color.title()
    return None
