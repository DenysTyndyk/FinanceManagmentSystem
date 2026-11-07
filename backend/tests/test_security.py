import jwt
from app import config
from app.security import (
    ALGORITHM,
    RateLimiter,
    create_access_token,
    hash_password,
    hash_token,
    new_opaque_token,
    validate_password_strength,
    verify_password,
)


def test_password_policy():
  assert validate_password_strength("krotkie1") is not None
  assert validate_password_strength("bezcyfrbezcyfr") is not None
  assert validate_password_strength("1234567890123") is not None
  assert validate_password_strength("Password123") is not None
  assert validate_password_strength("anna2026xyz!", "anna2026@example.com") is not None
  assert validate_password_strength("ą" * 40 + "1") is not None
  assert validate_password_strength("Zielony-Kot-77") is None


def test_password_hashing():
  hashed = hash_password("Zielony-Kot-77")
  assert verify_password("Zielony-Kot-77", hashed)
  assert not verify_password("zle-haslo-1", hashed)
  assert not verify_password("a" * 100, hashed)


def test_opaque_token_hash_matches():
  raw, token_hash = new_opaque_token()
  assert hash_token(raw) == token_hash
  assert raw not in token_hash


def test_access_token_payload():
  payload = jwt.decode(create_access_token(42), config.JWT_SECRET, algorithms=[ALGORITHM])
  assert payload["sub"] == "42"
  assert payload["type"] == "access"


def test_rate_limiter_blocks_after_limit():
  limiter = RateLimiter(limit=3, window_seconds=60)
  assert [limiter.hit("ip") for _ in range(4)] == [True, True, True, False]
  assert limiter.hit("inne-ip")
