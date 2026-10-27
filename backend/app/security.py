from datetime import datetime, timedelta, timezone
import bcrypt
import jwt

# Klucz do podpisywania tokenów (docelowo powinien być w pliku .env)
SECRET_KEY = "super-tajny-klucz-zmien-w-produkcji"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24  # Token ważny przez 24 godziny


def hash_password(password: str) -> str:
  """Haszuje hasło tekstowe za pomocą biblioteki bcrypt."""
  pwd_bytes = password.encode("utf-8")
  salt = bcrypt.gensalt()
  return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
  """Weryfikuje, czy podane hasło zgadza się z haszem w bazie."""
  return bcrypt.checkpw(
      plain_password.encode("utf-8"), hashed_password.encode("utf-8")
  )


def create_access_token(data: dict) -> str:
  """Tworzy token JWT z czasem wygaśnięcia."""
  to_encode = data.copy()
  expire = datetime.now(timezone.utc) + timedelta(
      hours=ACCESS_TOKEN_EXPIRE_HOURS
  )
  to_encode.update({"exp": expire})
  return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)