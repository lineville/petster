"""Swipe & recommendation endpoints.

New users swipe left / right on dog profiles. Their swipe history drives
a recommendation engine that surfaces the most compatible dogs.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dog, User, Swipe, UserPreference, SwipeDirection
from app.schemas import (
    SwipeRequest,
    SwipeOut,
    SwipeCard,
    DogOut,
    RecommendationOut,
    UserPreferenceOut,
)
from app.services.recommendation import recompute_preferences, get_recommendations

router = APIRouter(prefix="/swipe", tags=["Swipe & Recommendations"])


# ── Get next batch of swipe cards ────────────────────────────────────────────

@router.get("/{user_id}/cards", response_model=List[SwipeCard])
def get_swipe_cards(
    user_id: int,
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
):
    """Return the next batch of dog cards for a user to swipe on.

    Cards are ranked by compatibility score when sufficient swipe data
    exists; otherwise they are returned in database order.
    """
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    results = get_recommendations(db, user_id, limit=limit)
    return [
        SwipeCard(dog=DogOut.model_validate(dog), compatibility_score=score)
        for dog, score in results
    ]


# ── Record a swipe ──────────────────────────────────────────────────────────

@router.post("/{user_id}", response_model=SwipeOut, status_code=201)
def record_swipe(
    user_id: int,
    payload: SwipeRequest,
    db: Session = Depends(get_db),
):
    """Record a left or right swipe and recompute preferences on right-swipe."""
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    dog = db.query(Dog).get(payload.dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")

    # Prevent duplicate swipes
    existing = (
        db.query(Swipe)
        .filter(Swipe.user_id == user_id, Swipe.dog_id == payload.dog_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already swiped on this dog")

    swipe = Swipe(
        user_id=user_id,
        dog_id=payload.dog_id,
        direction=payload.direction,
    )
    db.add(swipe)
    db.commit()
    db.refresh(swipe)

    # Recompute preferences on right-swipe
    if payload.direction == SwipeDirection.right:
        recompute_preferences(db, user_id)

    return swipe


# ── Recommendations (explicit endpoint) ─────────────────────────────────────

@router.get("/{user_id}/recommendations", response_model=RecommendationOut)
def get_user_recommendations(
    user_id: int,
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
):
    """Get personalized dog recommendations based on swipe history."""
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    results = get_recommendations(db, user_id, limit=limit)
    dogs = [DogOut.model_validate(dog) for dog, _ in results]
    swipe_count = db.query(Swipe).filter(Swipe.user_id == user_id).count()

    message = (
        f"Personalized recommendations based on {swipe_count} swipes."
        if swipe_count >= 3
        else "Keep swiping! We need a few more likes to personalize results."
    )
    return RecommendationOut(dogs=dogs, message=message)


# ── View derived preferences ────────────────────────────────────────────────

@router.get("/{user_id}/preferences", response_model=UserPreferenceOut)
def get_user_preferences(user_id: int, db: Session = Depends(get_db)):
    """Return the user's computed preference profile."""
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.preferences:
        raise HTTPException(
            status_code=404,
            detail="No preferences yet – swipe right on some dogs first!",
        )
    return user.preferences


# ── Reset swipes ─────────────────────────────────────────────────────────────

@router.delete("/{user_id}/reset", status_code=204)
def reset_swipes(user_id: int, db: Session = Depends(get_db)):
    """Delete all swipe history and preferences for a user so they can start over."""
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(Swipe).filter(Swipe.user_id == user_id).delete()
    db.query(UserPreference).filter(UserPreference.user_id == user_id).delete()
    db.commit()
