"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api.routes import ai, analytics, auth, pollution
from app.core.config import get_settings
from app.core.database import Base, AsyncSessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole

settings = get_settings()


async def seed_default_users():
    """Create default admin and demo users on first startup."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "admin@airguardian.gov"))
        if result.scalar_one_or_none():
            return

        users = [
            User(
                email="admin@airguardian.gov",
                full_name="City Administrator",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
            ),
            User(
                email="analyst@airguardian.gov",
                full_name="Air Quality Analyst",
                hashed_password=get_password_hash("analyst123"),
                role=UserRole.ANALYST,
            ),
            User(
                email="citizen@example.com",
                full_name="Demo Citizen",
                hashed_password=get_password_hash("citizen123"),
                role=UserRole.CITIZEN,
            ),
        ]
        for user in users:
            db.add(user)
        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_default_users()
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered urban air pollution prediction and intervention platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(pollution.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    db_backend = "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql"
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mock_mode": settings.USE_MOCK_DATA,
        "database": db_backend,
    }
