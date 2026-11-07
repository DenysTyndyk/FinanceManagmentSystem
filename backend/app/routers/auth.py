import logging
import math
from datetime import datetime, timedelta, timezone

from app import config
from app.database import get_db
from app.mailer import send_email
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.auth import (
    EmailPayload,
    MessageResponse,
    PasswordResetPayload,
    TokenPayload,
    TokenResponse,
    UserLogin,
    UserProfileResponse,
    UserRegister,
)
from app.security import (
    RateLimiter,
    create_access_token,
    get_current_user,
    hash_password,
    hash_token,
    new_opaque_token,
    rate_limit,
    validate_password_strength,
    verify_password,
)
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger("app.auth")

REFRESH_COOKIE = "refresh_token"
VERIFY_TOKEN_HOURS = 24
RESET_TOKEN_MINUTES = 60
MAX_FAILED_LOGINS = 5
LOCK_MINUTES = 15
# Równoległe odświeżenie z kilku kart nie jest traktowane jako kradzież tokena
REUSE_GRACE_SECONDS = 30
INVALID_CREDENTIALS = "Nieprawidłowy e-mail lub hasło"
SESSION_EXPIRED = "Sesja wygasła. Zaloguj się ponownie."

# Hasz zastępczy: wyrównuje czas odpowiedzi, gdy konto nie istnieje (utrudnia zgadywanie e-maili)
DUMMY_HASH = hash_password("dummy-password-for-timing-1")

login_limiter = RateLimiter(limit=10, window_seconds=60)
email_limiter = RateLimiter(limit=5, window_seconds=300)


def _now() -> datetime:
  return datetime.now(timezone.utc)


def _ip(request: Request) -> str:
  return request.client.host if request.client else "unknown"


def _find_active_user(db: Session, email: str):
  return db.query(User).filter(User.email == email.lower(), User.deleted_at.is_(None)).first()


def _revoke_all_sessions(db: Session, user_id: int) -> None:
  db.query(RefreshToken).filter(
      RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)
  ).update({"revoked_at": _now()})


def _issue_session(user: User, request: Request, response: Response, db: Session) -> dict:
  """Zapisuje nową sesję, ustawia ciasteczko httpOnly z tokenem odświeżającym i zwraca token dostępowy."""
  raw, token_hash = new_opaque_token()
  db.add(
      RefreshToken(
          user_id=user.id,
          token_hash=token_hash,
          expires_at=_now() + timedelta(days=config.REFRESH_TOKEN_DAYS),
          created_ip=_ip(request),
          user_agent=(request.headers.get("user-agent") or "")[:255],
      )
  )
  db.commit()
  response.set_cookie(
      REFRESH_COOKIE,
      raw,
      max_age=config.REFRESH_TOKEN_DAYS * 24 * 3600,
      httponly=True,
      secure=config.COOKIE_SECURE,
      samesite="lax",
      path="/auth",
  )
  return {
      "access_token": create_access_token(user.id),
      "token_type": "bearer",
      "first_name": user.first_name,
      "email": user.email,
  }


def _send_verification(user: User, background_tasks: BackgroundTasks) -> None:
  raw, token_hash = new_opaque_token()
  user.email_verification_token = token_hash
  user.email_verification_expires_at = _now() + timedelta(hours=VERIFY_TOKEN_HOURS)
  link = f"{config.FRONTEND_URL}/weryfikacja?token={raw}"
  background_tasks.add_task(
      send_email,
      user.email,
      "Potwierdź adres e-mail – FinManager",
      f"Cześć {user.first_name},\n\nkliknij link, aby potwierdzić adres e-mail:\n{link}\n\n"
      f"Link jest ważny {VERIFY_TOKEN_HOURS} godziny.",
  )


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(email_limiter))],
)
def register(
    payload: UserRegister,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
  email = payload.email.lower()
  if db.query(User).filter(User.email == email).first():
    logger.info("rejestracja_odrzucona email=%s ip=%s powod=email_zajety", email, _ip(request))
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Użytkownik z tym adresem e-mail już istnieje",
    )

  user = User(
      first_name=payload.firstName,
      last_name=payload.lastName,
      email=email,
      password_hash=hash_password(payload.password),
  )
  db.add(user)
  db.flush()
  db.add(
      UserProfile(
          user_id=user.id,
          date_of_birth=payload.birthDate,
          consent_personal_data=payload.consentPersonal,
          consent_marketing=payload.consentMarketing,
          consent_updated_at=_now(),
      )
  )
  _send_verification(user, background_tasks)
  db.commit()

  logger.info("rejestracja user_id=%s email=%s ip=%s", user.id, email, _ip(request))
  return {"message": "Konto utworzone. Sprawdź skrzynkę e-mail i potwierdź adres."}


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(payload: TokenPayload, request: Request, db: Session = Depends(get_db)):
  user = db.query(User).filter(User.email_verification_token == hash_token(payload.token)).first()
  if not user or not user.email_verification_expires_at or user.email_verification_expires_at <= _now():
    logger.warning("weryfikacja_nieudana ip=%s", _ip(request))
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Link weryfikacyjny jest nieprawidłowy lub wygasł.",
    )

  user.email_verified_at = _now()
  if user.status == "PendingVerification":
    user.status = "Active"
  user.email_verification_token = None
  user.email_verification_expires_at = None
  db.commit()

  logger.info("weryfikacja_email user_id=%s", user.id)
  return {"message": "Adres e-mail potwierdzony. Możesz się zalogować."}


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(email_limiter))],
)
def resend_verification(
    payload: EmailPayload, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
  user = _find_active_user(db, payload.email)
  if user and user.status == "PendingVerification":
    _send_verification(user, background_tasks)
    db.commit()
    logger.info("weryfikacja_ponowna user_id=%s", user.id)
  # Ta sama odpowiedź niezależnie od istnienia konta
  return {"message": "Jeśli konto wymaga potwierdzenia, wysłaliśmy nowy link."}


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(login_limiter))],
)
def login(payload: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
  email = payload.email.lower()
  ip = _ip(request)
  now = _now()
  user = _find_active_user(db, email)

  if not user:
    verify_password(payload.password, DUMMY_HASH)
    logger.warning("logowanie_nieudane email=%s ip=%s powod=brak_konta", email, ip)
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS)

  if user.locked_until and user.locked_until > now:
    minutes = math.ceil((user.locked_until - now).total_seconds() / 60)
    logger.warning("logowanie_odrzucone user_id=%s ip=%s powod=konto_zablokowane", user.id, ip)
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=f"Zbyt wiele nieudanych prób. Spróbuj ponownie za {minutes} min.",
    )

  if not verify_password(payload.password, user.password_hash):
    user.failed_login_attempts += 1
    if user.failed_login_attempts >= MAX_FAILED_LOGINS:
      user.locked_until = now + timedelta(minutes=LOCK_MINUTES)
      user.failed_login_attempts = 0
      logger.warning("konto_zablokowane user_id=%s ip=%s minut=%s", user.id, ip, LOCK_MINUTES)
    else:
      logger.warning(
          "logowanie_nieudane user_id=%s ip=%s powod=zle_haslo proba=%s",
          user.id, ip, user.failed_login_attempts,
      )
    db.commit()
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS)

  if user.status == "PendingVerification":
    logger.info("logowanie_odrzucone user_id=%s ip=%s powod=email_niepotwierdzony", user.id, ip)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "email_not_verified", "message": "Potwierdź adres e-mail, zanim się zalogujesz."},
    )
  if user.status != "Active":
    logger.warning("logowanie_odrzucone user_id=%s ip=%s powod=status_%s", user.id, ip, user.status)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Konto jest nieaktywne. Skontaktuj się z administratorem.",
    )

  user.failed_login_attempts = 0
  user.locked_until = None
  logger.info("logowanie user_id=%s ip=%s", user.id, ip)
  return _issue_session(user, request, response, db)


@router.post("/refresh", response_model=TokenResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
  raw = request.cookies.get(REFRESH_COOKIE)
  if not raw:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=SESSION_EXPIRED)

  now = _now()
  session = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(raw)).first()
  if not session or session.expires_at <= now:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=SESSION_EXPIRED)

  if session.revoked_at:
    if now - session.revoked_at > timedelta(seconds=REUSE_GRACE_SECONDS):
      # Ponowne użycie starego tokena = prawdopodobna kradzież: unieważniamy wszystkie sesje
      _revoke_all_sessions(db, session.user_id)
      db.commit()
      logger.warning("refresh_ponowne_uzycie user_id=%s ip=%s", session.user_id, _ip(request))
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=SESSION_EXPIRED)

  user = db.query(User).filter(User.id == session.user_id, User.deleted_at.is_(None)).first()
  if not user or user.status != "Active":
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=SESSION_EXPIRED)

  # Rotacja: każdy token odświeżający działa tylko raz
  session.revoked_at = now
  return _issue_session(user, request, response, db)


@router.post("/logout", response_model=MessageResponse)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
  raw = request.cookies.get(REFRESH_COOKIE)
  if raw:
    session = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(raw)).first()
    if session and not session.revoked_at:
      session.revoked_at = _now()
      db.commit()
      logger.info("wylogowanie user_id=%s ip=%s", session.user_id, _ip(request))
  response.delete_cookie(
      REFRESH_COOKIE, path="/auth", httponly=True, secure=config.COOKIE_SECURE, samesite="lax"
  )
  return {"message": "Wylogowano."}


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(email_limiter))],
)
def forgot_password(
    payload: EmailPayload,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
  user = _find_active_user(db, payload.email)
  if user and user.status in ("Active", "PendingVerification"):
    raw, token_hash = new_opaque_token()
    user.password_reset_token = token_hash
    user.password_reset_expires_at = _now() + timedelta(minutes=RESET_TOKEN_MINUTES)
    db.commit()
    link = f"{config.FRONTEND_URL}/reset-hasla?token={raw}"
    background_tasks.add_task(
        send_email,
        user.email,
        "Zmiana hasła – FinManager",
        f"Cześć {user.first_name},\n\nkliknij link, aby ustawić nowe hasło:\n{link}\n\n"
        f"Link jest ważny {RESET_TOKEN_MINUTES} minut. Jeśli to nie Ty, zignoruj tę wiadomość.",
    )
    logger.info("reset_hasla_zadanie user_id=%s ip=%s", user.id, _ip(request))
  return {"message": "Jeśli konto istnieje, wysłaliśmy link do zmiany hasła."}


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(login_limiter))],
)
def reset_password(payload: PasswordResetPayload, request: Request, db: Session = Depends(get_db)):
  user = db.query(User).filter(User.password_reset_token == hash_token(payload.token)).first()
  if not user or not user.password_reset_expires_at or user.password_reset_expires_at <= _now():
    logger.warning("reset_hasla_nieudany ip=%s", _ip(request))
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Link do zmiany hasła jest nieprawidłowy lub wygasł.",
    )

  error = validate_password_strength(payload.password, user.email)
  if error:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

  user.password_hash = hash_password(payload.password)
  user.password_reset_token = None
  user.password_reset_expires_at = None
  user.failed_login_attempts = 0
  user.locked_until = None
  # Link z e-maila potwierdza też własność skrzynki
  if user.status == "PendingVerification":
    user.status = "Active"
    user.email_verified_at = _now()
  _revoke_all_sessions(db, user.id)
  db.commit()

  logger.info("reset_hasla user_id=%s ip=%s", user.id, _ip(request))
  return {"message": "Hasło zostało zmienione. Zaloguj się nowym hasłem."}


@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
  profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
  return {
      "id": current_user.id,
      "firstName": current_user.first_name,
      "lastName": current_user.last_name,
      "email": current_user.email,
      "birthDate": profile.date_of_birth if profile else None,
      "consentPersonal": profile.consent_personal_data if profile else False,
      "consentMarketing": profile.consent_marketing if profile else False,
  }
