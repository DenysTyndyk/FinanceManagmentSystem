import os

# Konfiguracja aplikacji odczytywana ze zmiennych środowiskowych

JWT_SECRET = os.getenv("JWT_SECRET", "")
if len(JWT_SECRET) < 32 or JWT_SECRET == "change-me":
  raise RuntimeError("JWT_SECRET musi być ustawiony i mieć co najmniej 32 znaki (openssl rand -hex 32)")

ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "15"))
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", "7"))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

# W produkcji (HTTPS) musi być "true", inaczej ciasteczko sesji poleci otwartym tekstem
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "FinManager <no-reply@finmanager.app>")
