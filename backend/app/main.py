from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import forms, public, questions, responses


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Typeform Clone API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router, prefix="/api/forms", tags=["forms"])
app.include_router(questions.router, prefix="/api/forms", tags=["questions"])
app.include_router(responses.router, prefix="/api/forms", tags=["responses"])
app.include_router(public.router, prefix="/api/public", tags=["public"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
