from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import applications, auth, jobs, resume


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates tables on first run. We will replace this with Alembic migrations later.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Job Portal API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(resume.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
