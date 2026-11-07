import logging

from app import config
from app.database import Base, engine
from app.models import refresh_token, user, user_profile  # Zaimportowanie modeli, aby SQLAlchemy je zarejestrowało
from app.routers import auth, finances
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Logi aplikacji (zdarzenia logowania, rejestracji, blokad) trafiają na stdout -> `docker compose logs backend`
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

# Automatycznie tworzy brakujące tabele w PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finance Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(finances.router)


@app.get("/health", tags=["System"])
def health():
  return {"status": "ok"}
