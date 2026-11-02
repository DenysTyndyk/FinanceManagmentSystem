from app.database import get_db
from app.models.user import User
from app.schemas.auth import TokenResponse, UserLogin, UserRegister
from app.security import create_access_token, hash_password, verify_password
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserRegister, db: Session = Depends(get_db)):
  # 1. Sprawdzenie, czy użytkownik o takim mailu już istnieje
  existing_user = db.query(User).filter(User.email == payload.email).first()
  if existing_user:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Użytkownik z tym adresem e-mail już istnieje",
    )

  # 2. Bezpieczne haszowanie hasła
  hashed_pwd = hash_password(payload.password)

  # 3. Zapis nowego rekordu w bazie
  new_user = User(
      first_name=payload.firstName,
      last_name=payload.lastName,
      email=payload.email,
      hashed_password=hashed_pwd,
      birth_date=payload.birthDate,
      consent_personal=payload.consentPersonal,
      consent_marketing=payload.consentMarketing,
  )
  db.add(new_user)
  db.commit()
  db.refresh(new_user)

  # 4. Wygenerowanie tokena JWT
  token = create_access_token(data={"sub": str(new_user.id)})

  return {
      "access_token": token,
      "token_type": "bearer",
      "first_name": new_user.first_name,
      "email": new_user.email,
  }


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
  # 1. Wyszukanie użytkownika w bazie
  user = db.query(User).filter(User.email == payload.email).first()
  if not user:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nieprawidłowy e-mail lub hasło",
    )

  # 2. Weryfikacja hasła z haszem z bazy
  if not verify_password(payload.password, user.hashed_password):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nieprawidłowy e-mail lub hasło",
    )

  # 3. Wygenerowanie nowego tokena JWT
  token = create_access_token(data={"sub": str(user.id)})

  return {
      "access_token": token,
      "token_type": "bearer",
      "first_name": user.first_name,
      "email": user.email,
  }