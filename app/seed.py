"""Seed the database with mock dog profiles and a demo user."""

from app.database import SessionLocal, engine, Base
from app.models import Dog, User, SizeEnum, SexEnum, CoatLengthEnum


MOCK_DOGS = [
    Dog(
        name="Millie",
        breed="Golden Border Collie Mix",
        size=SizeEnum.medium,
        age_years=7,
        weight_lbs=40,
        color="Golden",
        description="Flirty girl, makes direct eye contact. Very smart and affectionate. Loves to cuddle and play fetch.",
        sex=SexEnum.female,
        coat_length=CoatLengthEnum.long,
        is_rescue=True,
        good_with_cats=False,
        good_with_kids=False,
        image_url="/dogs/dog-01.jpg",
    ),
    Dog(
        name="Luna",
        breed="German Shepherd",
        size=SizeEnum.large,
        age_years=2,
        weight_lbs=65,
        color="Black and Tan",
        description="Smart and protective. Great guard dog.",
        sex=SexEnum.female,
        coat_length=CoatLengthEnum.medium,
        is_rescue=False,
        good_with_cats=False,
        good_with_kids=True,
        image_url="/dogs/dog-02.jpg",
    ),
    Dog(
        name="Max",
        breed="French Bulldog",
        size=SizeEnum.small,
        age_years=1.5,
        weight_lbs=25,
        color="Brindle",
        description="Playful couch potato. Snores like a freight train.",
        sex=SexEnum.male,
        coat_length=CoatLengthEnum.short,
        is_rescue=True,
        good_with_cats=True,
        good_with_kids=True,
        image_url="/dogs/dog-03.jpg",
    ),
    Dog(
        name="Bella",
        breed="Labrador Retriever",
        size=SizeEnum.large,
        age_years=4,
        weight_lbs=75,
        color="Chocolate",
        description="Energetic swimmer. Will eat anything.",
        sex=SexEnum.female,
        coat_length=CoatLengthEnum.short,
        is_rescue=True,
        good_with_cats=True,
        good_with_kids=True,
        image_url="/dogs/dog-04.jpg",
    ),
    Dog(
        name="Charlie",
        breed="Beagle",
        size=SizeEnum.medium,
        age_years=5,
        weight_lbs=30,
        color="Tricolor",
        description="Nose-driven explorer. Howls at squirrels.",
        sex=SexEnum.male,
        coat_length=CoatLengthEnum.short,
        is_rescue=False,
        good_with_cats=False,
        good_with_kids=True,
        image_url="/dogs/dog-05.jpg",
    ),
    Dog(
        name="Daisy",
        breed="Poodle",
        size=SizeEnum.medium,
        age_years=2,
        weight_lbs=45,
        color="White",
        description="Hypoallergenic and elegant. Loves agility courses.",
        sex=SexEnum.female,
        coat_length=CoatLengthEnum.long,
        is_rescue=False,
        good_with_cats=True,
        good_with_kids=True,
        image_url="/dogs/dog-06.jpg",
    ),
    Dog(
        name="Rocky",
        breed="Rottweiler",
        size=SizeEnum.extra_large,
        age_years=6,
        weight_lbs=110,
        color="Black and Mahogany",
        description="Gentle giant. Thinks he's a lap dog.",
        sex=SexEnum.male,
        coat_length=CoatLengthEnum.short,
        is_rescue=True,
        good_with_cats=False,
        good_with_kids=False,
        image_url="/dogs/dog-07.jpg",
    ),
    Dog(
        name="Sadie",
        breed="Australian Shepherd",
        size=SizeEnum.medium,
        age_years=1,
        weight_lbs=50,
        color="Blue Merle",
        description="Herds everything including the roomba.",
        sex=SexEnum.female,
        coat_length=CoatLengthEnum.long,
        is_rescue=True,
        good_with_cats=True,
        good_with_kids=True,
        image_url="/dogs/dog-08.jpg",
    ),
    Dog(
        name="Duke",
        breed="Boxer",
        size=SizeEnum.large,
        age_years=3,
        weight_lbs=65,
        color="Fawn",
        description="Bouncy and goofy. Face says grumpy but heart says love.",
        sex=SexEnum.male,
        coat_length=CoatLengthEnum.short,
        is_rescue=False,
        good_with_cats=False,
        good_with_kids=True,
        image_url="/dogs/dog-09.jpg",
    ),
    Dog(
        name="Molly",
        breed="Yorkshire Terrier",
        size=SizeEnum.small,
        age_years=7,
        weight_lbs=7,
        color="Blue and Tan",
        description="Tiny but fierce. Rules the house.",
        sex=SexEnum.female,
        coat_length=CoatLengthEnum.long,
        is_rescue=True,
        good_with_cats=True,
        good_with_kids=False,
        image_url="/dogs/dog-10.jpg",
    ),
    Dog(
        name="Tucker",
        breed="Siberian Husky",
        size=SizeEnum.large,
        age_years=2,
        weight_lbs=55,
        color="Gray and White",
        description="Talks more than barks. Escape artist.",
        sex=SexEnum.male,
        coat_length=CoatLengthEnum.long,
        is_rescue=False,
        good_with_cats=False,
        good_with_kids=True,
        image_url="/dogs/dog-11.jpg",
    ),
    Dog(
        name="Penny",
        breed="Dachshund",
        size=SizeEnum.small,
        age_years=4,
        weight_lbs=11,
        color="Red",
        description="Long and low. Burrows under every blanket.",
        sex=SexEnum.female,
        coat_length=CoatLengthEnum.short,
        is_rescue=True,
        good_with_cats=True,
        good_with_kids=True,
        image_url="/dogs/dog-12.jpg",
    ),
    Dog(
        name="Bear",
        breed="Bernese Mountain Dog",
        size=SizeEnum.extra_large,
        age_years=3,
        weight_lbs=100,
        color="Tricolor",
        description="Fluffy cloud of love. Drools with affection.",
        sex=SexEnum.male,
        coat_length=CoatLengthEnum.long,
        is_rescue=False,
        good_with_cats=True,
        good_with_kids=True,
        image_url="/dogs/dog-13.jpg",
    ),
    Dog(
        name="Coco",
        breed="Shih Tzu",
        size=SizeEnum.small,
        age_years=6,
        weight_lbs=14,
        color="Gold and White",
        description="Professional cuddler. Expert at giving puppy eyes.",
        sex=SexEnum.female,
        coat_length=CoatLengthEnum.long,
        is_rescue=True,
        good_with_cats=True,
        good_with_kids=True,
        image_url="/dogs/dog-14.jpg",
    )
]


def seed_database():
    """Drop all tables, recreate them, and insert mock data."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Add mock dogs
        db.add_all(MOCK_DOGS)

        # Add a demo user
        demo_user = User(username="demo_user", email="demo@tingrrr.app")
        db.add(demo_user)

        db.commit()
        print(f"✅  Seeded {len(MOCK_DOGS)} dogs and 1 demo user.")
    except Exception as e:
        db.rollback()
        print(f"❌  Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
