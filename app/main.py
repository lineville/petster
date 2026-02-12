"""Tingrrr API – FastAPI application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.config import get_settings
from app.database import engine, Base
from app.routers import dogs, users, swipe, rescue

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup (dev convenience)."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API for Tingrrr – swipe right on your perfect pup.\n\n"
        "**Features:**\n"
        "- Browse & manage dog profiles\n"
        "- Swipe left/right to build a preference profile\n"
        "- Get personalized dog recommendations\n"
        "- Rescue orgs upload images → Azure AI Vision auto-fills dog attributes\n"
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ── Register routers ────────────────────────────────────────────────────────

app.include_router(dogs.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(swipe.router, prefix="/api/v1")
app.include_router(rescue.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.app_name}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
