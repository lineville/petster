"""SQLAlchemy ORM models for the Petster database."""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ── Enums ────────────────────────────────────────────────────────────────────

class SizeEnum(str, enum.Enum):
    small = "small"
    medium = "medium"
    large = "large"
    extra_large = "extra_large"


class SexEnum(str, enum.Enum):
    male = "male"
    female = "female"


class CoatLengthEnum(str, enum.Enum):
    short = "short"
    medium = "medium"
    long = "long"
    wire = "wire"
    hairless = "hairless"


class SwipeDirection(str, enum.Enum):
    left = "left"
    right = "right"


# ── Dog ──────────────────────────────────────────────────────────────────────

class Dog(Base):
    __tablename__ = "dogs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    breed = Column(String(100), nullable=False)
    size = Column(SAEnum(SizeEnum, native_enum=False), nullable=False)
    age_years = Column(Float, nullable=False)
    weight_lbs = Column(Float, nullable=False)
    color = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    sex = Column(SAEnum(SexEnum, native_enum=False), nullable=False)
    coat_length = Column(SAEnum(CoatLengthEnum, native_enum=False), nullable=False)
    is_rescue = Column(Boolean, default=False)
    good_with_cats = Column(Boolean, default=False)
    good_with_kids = Column(Boolean, default=False)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    swipes = relationship("Swipe", back_populates="dog")


# ── User ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    swipes = relationship("Swipe", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)


# ── Swipe ────────────────────────────────────────────────────────────────────

class Swipe(Base):
    __tablename__ = "swipes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    direction = Column(SAEnum(SwipeDirection, native_enum=False), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="swipes")
    dog = relationship("Dog", back_populates="swipes")


# ── UserPreference (computed from swipe history) ─────────────────────────────

class UserPreference(Base):
    """Aggregated preferences derived from a user's right-swipe history."""
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Preferred attributes (nullable = not enough data yet)
    preferred_size = Column(SAEnum(SizeEnum, native_enum=False), nullable=True)
    preferred_breed = Column(String(100), nullable=True)
    preferred_coat_length = Column(SAEnum(CoatLengthEnum, native_enum=False), nullable=True)
    min_age = Column(Float, nullable=True)
    max_age = Column(Float, nullable=True)
    min_weight = Column(Float, nullable=True)
    max_weight = Column(Float, nullable=True)
    prefers_good_with_cats = Column(Boolean, nullable=True)
    prefers_good_with_kids = Column(Boolean, nullable=True)
    prefers_rescue = Column(Boolean, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="preferences")
