"""Recommendation engine based on user swipe history.

After each right-swipe the user's aggregated preferences are recomputed.
Recommendations are then scored against unswiped dogs.
"""

from collections import Counter
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import (
    Dog,
    Swipe,
    SwipeDirection,
    UserPreference,
    SizeEnum,
    CoatLengthEnum,
)


def recompute_preferences(db: Session, user_id: int) -> UserPreference:
    """Recompute a user's preferences from all their right-swipes."""

    right_swiped = (
        db.query(Dog)
        .join(Swipe, Swipe.dog_id == Dog.id)
        .filter(Swipe.user_id == user_id, Swipe.direction == SwipeDirection.right)
        .all()
    )

    pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if not pref:
        pref = UserPreference(user_id=user_id)
        db.add(pref)

    if not right_swiped:
        db.commit()
        return pref

    # Most common size
    sizes = Counter(d.size for d in right_swiped)
    pref.preferred_size = sizes.most_common(1)[0][0]

    # Most common breed
    breeds = Counter(d.breed for d in right_swiped)
    pref.preferred_breed = breeds.most_common(1)[0][0]

    # Most common coat length
    coats = Counter(d.coat_length for d in right_swiped)
    pref.preferred_coat_length = coats.most_common(1)[0][0]

    # Age range (min / max of liked dogs)
    ages = [d.age_years for d in right_swiped]
    pref.min_age = min(ages)
    pref.max_age = max(ages)

    # Weight range
    weights = [d.weight_lbs for d in right_swiped]
    pref.min_weight = min(weights)
    pref.max_weight = max(weights)

    # Boolean preferences – majority vote
    pref.prefers_good_with_cats = _majority([d.good_with_cats for d in right_swiped])
    pref.prefers_good_with_kids = _majority([d.good_with_kids for d in right_swiped])
    pref.prefers_rescue = _majority([d.is_rescue for d in right_swiped])

    db.commit()
    db.refresh(pref)
    return pref


def get_recommendations(
    db: Session, user_id: int, limit: int = 10
) -> list[tuple[Dog, float]]:
    """Return unswiped dogs ranked by compatibility score (0-100)."""

    # IDs the user has already swiped on
    swiped_ids = (
        db.query(Swipe.dog_id).filter(Swipe.user_id == user_id).subquery()
    )

    candidates = (
        db.query(Dog).filter(Dog.id.notin_(swiped_ids)).all()
    )

    pref = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == user_id)
        .first()
    )

    if not pref:
        # No preferences yet – return candidates in random order
        return [(dog, 50.0) for dog in candidates[:limit]]

    scored: list[tuple[Dog, float]] = []
    for dog in candidates:
        score = _score_dog(dog, pref)
        scored.append((dog, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]


def _score_dog(dog: Dog, pref: UserPreference) -> float:
    """Score a dog 0-100 against user preferences."""
    total = 0.0
    max_points = 0.0

    # Size match (20 pts)
    max_points += 20
    if pref.preferred_size and dog.size == pref.preferred_size:
        total += 20

    # Breed match (15 pts)
    max_points += 15
    if pref.preferred_breed and dog.breed.lower() == pref.preferred_breed.lower():
        total += 15

    # Coat length match (10 pts)
    max_points += 10
    if pref.preferred_coat_length and dog.coat_length == pref.preferred_coat_length:
        total += 10

    # Age in range (15 pts, partial credit)
    max_points += 15
    if pref.min_age is not None and pref.max_age is not None:
        if pref.min_age <= dog.age_years <= pref.max_age:
            total += 15
        else:
            # partial credit based on distance
            dist = min(
                abs(dog.age_years - pref.min_age),
                abs(dog.age_years - pref.max_age),
            )
            total += max(0, 15 - dist * 3)

    # Weight in range (15 pts, partial credit)
    max_points += 15
    if pref.min_weight is not None and pref.max_weight is not None:
        if pref.min_weight <= dog.weight_lbs <= pref.max_weight:
            total += 15
        else:
            dist = min(
                abs(dog.weight_lbs - pref.min_weight),
                abs(dog.weight_lbs - pref.max_weight),
            )
            total += max(0, 15 - dist * 0.3)

    # Good with cats (10 pts)
    max_points += 10
    if pref.prefers_good_with_cats is not None:
        if dog.good_with_cats == pref.prefers_good_with_cats:
            total += 10

    # Good with kids (10 pts)
    max_points += 10
    if pref.prefers_good_with_kids is not None:
        if dog.good_with_kids == pref.prefers_good_with_kids:
            total += 10

    # Rescue preference (5 pts)
    max_points += 5
    if pref.prefers_rescue is not None:
        if dog.is_rescue == pref.prefers_rescue:
            total += 5

    return round((total / max_points) * 100, 1) if max_points else 50.0


def _majority(values: list[bool]) -> Optional[bool]:
    if not values:
        return None
    return sum(values) > len(values) / 2
