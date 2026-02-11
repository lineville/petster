"""Pydantic schemas for request / response validation."""

from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models import SizeEnum, SexEnum, CoatLengthEnum, SwipeDirection


# ── Dog ──────────────────────────────────────────────────────────────────────

class DogBase(BaseModel):
    name: str = Field(..., max_length=100)
    breed: str = Field(..., max_length=100)
    size: SizeEnum
    age_years: float = Field(..., ge=0)
    weight_lbs: float = Field(..., ge=0)
    color: str = Field(..., max_length=100)
    description: Optional[str] = None
    sex: SexEnum
    coat_length: CoatLengthEnum
    is_rescue: bool = False
    good_with_cats: bool = False
    good_with_kids: bool = False
    image_url: Optional[str] = None


class DogCreate(DogBase):
    pass


class DogUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    size: Optional[SizeEnum] = None
    age_years: Optional[float] = None
    weight_lbs: Optional[float] = None
    color: Optional[str] = None
    description: Optional[str] = None
    sex: Optional[SexEnum] = None
    coat_length: Optional[CoatLengthEnum] = None
    is_rescue: Optional[bool] = None
    good_with_cats: Optional[bool] = None
    good_with_kids: Optional[bool] = None
    image_url: Optional[str] = None


class DogOut(DogBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── User ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., max_length=50)
    email: str = Field(..., max_length=100)


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Swipe ────────────────────────────────────────────────────────────────────

class SwipeRequest(BaseModel):
    dog_id: int
    direction: SwipeDirection


class SwipeOut(BaseModel):
    id: int
    user_id: int
    dog_id: int
    direction: SwipeDirection
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Swipe card (what the frontend shows) ─────────────────────────────────────

class SwipeCard(BaseModel):
    """A dog profile card served to the user for swiping."""
    dog: DogOut
    compatibility_score: Optional[float] = Field(
        None, description="0-100 score based on user preferences"
    )


# ── Recommendations ──────────────────────────────────────────────────────────

class RecommendationOut(BaseModel):
    dogs: List[DogOut]
    message: str


# ── Azure Vision result ──────────────────────────────────────────────────────

class VisionAnalysisResult(BaseModel):
    """Pre-filled dog fields returned by Azure Computer Vision analysis."""
    breed: Optional[str] = None
    size: Optional[SizeEnum] = None
    color: Optional[str] = None
    coat_length: Optional[CoatLengthEnum] = None
    description: Optional[str] = None
    confidence: Optional[float] = None


class RescueImageUploadResponse(BaseModel):
    """Response after a rescue uploads a dog image for analysis."""
    dog: DogOut
    vision_analysis: VisionAnalysisResult
    message: str


# ── User Preferences ─────────────────────────────────────────────────────────

class UserPreferenceOut(BaseModel):
    preferred_size: Optional[SizeEnum] = None
    preferred_breed: Optional[str] = None
    preferred_coat_length: Optional[CoatLengthEnum] = None
    min_age: Optional[float] = None
    max_age: Optional[float] = None
    min_weight: Optional[float] = None
    max_weight: Optional[float] = None
    prefers_good_with_cats: Optional[bool] = None
    prefers_good_with_kids: Optional[bool] = None
    prefers_rescue: Optional[bool] = None

    model_config = {"from_attributes": True}
