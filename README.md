# Petster

An app to help people find their dream pet and help rescues easily manage their pet listings.

## Architecture

```
app/
├── main.py                  # FastAPI entry point
├── config.py                # Settings via .env
├── database.py              # SQLAlchemy engine & session
├── models.py                # ORM models (Dog, User, Swipe, UserPreference)
├── schemas.py               # Pydantic request/response schemas
├── seed.py                  # Mock data seeder (25 dogs + demo user)
├── routers/
│   ├── dogs.py              # CRUD for dog profiles
│   ├── users.py             # User registration
│   ├── swipe.py             # Swipe left/right + recommendations
│   └── rescue.py            # Image upload → Azure AI Vision → auto-fill
└── services/
    ├── azure_vision.py      # Azure AI Vision integration
    └── recommendation.py    # Preference engine & scoring
```

## Quick Start

### 1. Start the database

**Option A – SQLite (default, no setup needed):**

The app defaults to a local SQLite database (`petster.db`). No Docker or Postgres required.

**Option B – PostgreSQL via Docker:**

```bash
docker compose up -d
```

Then set `DATABASE_URL` in your `.env`:

```
DATABASE_URL=postgresql+psycopg://petster:petster@localhost:5432/petster
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your Azure AI Vision credentials (optional for local dev)
```

### 4. Seed the database

```bash
python -m app.seed
```

### 5. Run the API

```bash
uvicorn app.main:app --reload
```

Visit **http://localhost:8000/docs** for the interactive Swagger UI.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/dogs/` | List all dogs |
| `GET` | `/api/v1/dogs/{id}` | Get a dog by ID |
| `POST` | `/api/v1/dogs/` | Create a dog manually |
| `PATCH` | `/api/v1/dogs/{id}` | Update a dog |
| `DELETE` | `/api/v1/dogs/{id}` | Delete a dog |
| `POST` | `/api/v1/users/` | Register a user |
| `GET` | `/api/v1/swipe/{user_id}/cards` | Get next batch of swipe cards |
| `POST` | `/api/v1/swipe/{user_id}` | Record a swipe (left/right) |
| `GET` | `/api/v1/swipe/{user_id}/recommendations` | Get personalized recommendations |
| `GET` | `/api/v1/swipe/{user_id}/preferences` | View computed preferences |
| `POST` | `/api/v1/rescue/upload` | Upload dog image → Azure Vision analysis |

## Azure AI Vision Integration

The rescue upload endpoint sends images to **Azure AI Vision Image Analysis 4.0**.
It extracts:
- **Breed** from tags, objects, and captions
- **Color** from visual tags
- **Size & coat length** via breed-based heuristic look-ups

### Setup

1. Create an **Azure AI Services** resource in the Azure Portal
2. Copy the **Endpoint** and **Key** into your `.env` file
3. If credentials are not set, the API returns mock analysis results

## Swipe & Recommendation Engine

1. New users call `GET /api/v1/swipe/{user_id}/cards` to receive dog profiles
2. Users swipe left (pass) or right (like) via `POST /api/v1/swipe/{user_id}`
3. On each right-swipe, the engine recomputes preferences:
   - Most common breed, size, coat length
   - Age and weight ranges
   - Majority-vote on boolean flags (cats, kids, rescue)
4. Future cards are scored 0-100 and sorted by compatibility

## Database

SQLite (default) or PostgreSQL with 4 tables:
- **dogs** – all dog profiles with breed, size, age, weight, color, coat, temperament flags
- **users** – registered users
- **swipes** – left/right swipe history per user
- **user_preferences** – aggregated preferences computed from right-swipes