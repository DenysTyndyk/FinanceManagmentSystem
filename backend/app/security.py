import hashlib
import logging
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from app import config
from app.database import get_db
from app.models.user import User
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

ALGORITHM = "HS256"
BCRYPT_MAX_BYTES = 72  # bcrypt nie obsługuje dłuższych haseł

COMMON_PASSWORDS = {
    "1234567890", "12345678910", "qwertyuiop", "password1", "password12", "password123",
    "haslo12345", "haslo123456", "qwerty1234", "qwerty12345", "zaq12wsxcde", "1qaz2wsx3edc",
    "iloveyou123", "admin12345", "abc1234567", "polska1234", "welcome123", "letmein123",
}

logger = logging.getLogger("app.security")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
  """Haszuje hasło tekstowe za pomocą biblioteki bcrypt."""
  return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
  """Weryfikuje, czy podane hasło zgadza się z haszem w bazie."""
  encoded = plain_password.encode("utf-8")
  if len(encoded) > BCRYPT_MAX_BYTES:
    return False
  return bcrypt.checkpw(encoded, hashed_password.encode("utf-8"))


def validate_password_strength(password: str, email: str = "") -> Optional[str]:
  """Zwraca komunikat błędu, jeśli hasło jest za słabe, w przeciwnym razie None."""
  if len(password) < 10:
    return "Hasło musi mieć co najmniej 10 znaków."
  if len(password.encode("utf-8")) > BCRYPT_MAX_BYTES:
    return "Hasło jest za długie (maksymalnie 72 bajty)."
  if not any(ch.isalpha() for ch in password) or not any(ch.isdigit() for ch in password):
    return "Hasło musi zawierać co najmniej jedną literę i jedną cyfrę."
  if password.lower() in COMMON_PASSWORDS:
    return "To hasło jest zbyt popularne. Wybierz inne."
  local_part = email.split("@")[0].lower()
  if len(local_part) >= 3 and local_part in password.lower():
    return "Hasło nie może zawierać adresu e-mail."
  return None


def hash_token(raw_token: str) -> str:
  """Skrót SHA-256 tokena — w bazie trzymamy tylko skróty, nigdy surowe tokeny."""
  return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def new_opaque_token() -> tuple[str, str]:
  """Generuje losowy token (do wysłania użytkownikowi) i jego skrót (do zapisu w bazie)."""
  raw = secrets.token_urlsafe(32)
  return raw, hash_token(raw)


def create_access_token(user_id: int) -> str:
  """Tworzy krótko żyjący token dostępowy JWT."""
  expire = datetime.now(timezone.utc) + timedelta(minutes=config.ACCESS_TOKEN_MINUTES)
  payload = {"sub": str(user_id), "type": "access", "exp": expire}
  return jwt.encode(payload, config.JWT_SECRET, algorithm=ALGORITHM)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
  """Odczytuje użytkownika z tokena JWT przesłanego w nagłówku Authorization."""
  unauthorized = HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Nieprawidłowy lub wygasły token",
      headers={"WWW-Authenticate": "Bearer"},
  )
  if credentials is None:
    raise unauthorized
  try:
    payload = jwt.decode(credentials.credentials, config.JWT_SECRET, algorithms=[ALGORITHM])
    if payload.get("type") != "access":
      raise unauthorized
    user_id = int(payload["sub"])
  except (jwt.InvalidTokenError, KeyError, ValueError):
    raise unauthorized

  user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
  if not user or user.status != "Active":
    raise unauthorized
  return user


class RateLimiter:
  """Prosty limiter typu „okno przesuwne”: najwyżej `limit` żądań na `window_seconds` dla klucza."""

  # shortcut: liczniki w pamięci procesu — przy kilku instancjach backendu przenieść do Redis
  def __init__(self, limit: int, window_seconds: int):
    self.limit = limit
    self.window_seconds = window_seconds
    self._hits: dict[str, deque] = defaultdict(deque)

  def hit(self, key: str) -> bool:
    now = time.monotonic()
    hits = self._hits[key]
    while hits and now - hits[0] > self.window_seconds:
      hits.popleft()
    if len(hits) >= self.limit:
      return False
    hits.append(now)
    return True


def rate_limit(limiter: RateLimiter):
  """Zależność FastAPI ograniczająca liczbę żądań z jednego adresu IP do danego endpointu."""

  def dependency(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    if not limiter.hit(f"{request.url.path}:{ip}"):
      logger.warning("limit_zadan_przekroczony sciezka=%s ip=%s", request.url.path, ip)
      raise HTTPException(
          status_code=status.HTTP_429_TOO_MANY_REQUESTS,
          detail="Zbyt wiele żądań. Spróbuj ponownie za chwilę.",
      )

  return dependency
