"""Dog CRUD endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dog
from app.schemas import DogCreate, DogOut, DogUpdate

router = APIRouter(prefix="/dogs", tags=["Dogs"])


@router.get("/", response_model=List[DogOut])
def list_dogs(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """List all dogs with pagination."""
    return db.query(Dog).offset(skip).limit(limit).all()


@router.get("/{dog_id}", response_model=DogOut)
def get_dog(dog_id: int, db: Session = Depends(get_db)):
    dog = db.query(Dog).get(dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog


@router.post("/", response_model=DogOut, status_code=201)
def create_dog(payload: DogCreate, db: Session = Depends(get_db)):
    """Manually add a new dog profile."""
    dog = Dog(**payload.model_dump())
    db.add(dog)
    db.commit()
    db.refresh(dog)
    return dog


@router.patch("/{dog_id}", response_model=DogOut)
def update_dog(dog_id: int, payload: DogUpdate, db: Session = Depends(get_db)):
    dog = db.query(Dog).get(dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(dog, field, value)
    db.commit()
    db.refresh(dog)
    return dog


@router.delete("/{dog_id}", status_code=204)
def delete_dog(dog_id: int, db: Session = Depends(get_db)):
    dog = db.query(Dog).get(dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Dog not found")
    db.delete(dog)
    db.commit()
