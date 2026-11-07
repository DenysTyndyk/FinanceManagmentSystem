from datetime import date
from typing import Optional

from app.security import validate_password_strength
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

MIN_AGE = 16


class UserRegister(BaseModel):
  firstName: str = Field(max_length=100)
  lastName: str = Field(max_length=100)
  email: EmailStr
  password: str
  birthDate: Optional[date] = None
  consentPersonal: bool
  consentMarketing: bool = False

  @field_validator("firstName", "lastName")
  @classmethod
  def strip_name(cls, value: str) -> str:
    value = value.strip()
    if not value:
      raise ValueError("Imię i nazwisko są wymagane.")
    return value

  @model_validator(mode="after")
  def check_rules(self):
    if not self.consentPersonal:
      raise ValueError("Zgoda na przetwarzanie danych osobowych jest wymagana.")
    error = validate_password_strength(self.password, self.email)
    if error:
      raise ValueError(error)
    if self.birthDate:
      today = date.today()
      age = today.year - self.birthDate.year - ((today.month, today.day) < (self.birthDate.month, self.birthDate.day))
      if age < MIN_AGE:
        raise ValueError(f"Konto mogą założyć osoby, które ukończyły {MIN_AGE} lat.")
    return self


class UserLogin(BaseModel):
  email: EmailStr
  password: str = Field(max_length=200)


class EmailPayload(BaseModel):
  email: EmailStr


class TokenPayload(BaseModel):
  token: str = Field(min_length=10, max_length=200)


class PasswordResetPayload(BaseModel):
  token: str = Field(min_length=10, max_length=200)
  password: str


class MessageResponse(BaseModel):
  message: str


class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  first_name: str
  email: EmailStr


class UserProfileResponse(BaseModel):
  id: int
  firstName: Optional[str]
  lastName: Optional[str]
  email: EmailStr
  birthDate: Optional[date] = None
  consentPersonal: bool = False
  consentMarketing: bool = False
