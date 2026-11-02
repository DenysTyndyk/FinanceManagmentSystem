from app.database import Base, engine
from app.models import user  # Zaimportowanie modeli, aby SQLAlchemy je zarejestrowało
from app.routers import auth, finances
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Automatycznie tworzy brakujące tabele w PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finance Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(finances.router)


@app.get("/health", tags=["System"])
def health():
  return {"status": "ok"}