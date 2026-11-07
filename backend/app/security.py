from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import bcrypt
import jwt

# Klucz do podpisywania tokenów (docelowo powinien być w pliku .env)
SECRET_KEY = "super-tajny-klucz-zmien-w-produkcji"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24  # Token ważny przez 24 godziny

# Konfiguracja zabezpieczeń dla Swagger UI
security = HTTPBearer()

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

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> int:
  """Dekoduje token JWT z nagłówka Authorization: Bearer <token> i zwraca ID użytkownika."""
  token = credentials.credentials
  try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id: str = payload.get("sub")
    if user_id is None:
      raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED,
          detail="Nieprawidłowy token uwierzytelniający",
      )
    return int(user_id)
  except jwt.ExpiredSignatureError:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token wygasł",
    )
  except jwt.InvalidTokenError:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nieprawidłowy token uwierzytelniający",
    )