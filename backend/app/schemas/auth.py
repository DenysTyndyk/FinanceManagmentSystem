from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
  firstName: str
  lastName: str
  email: EmailStr
  password: str
  birthDate: Optional[date] = None
  consentPersonal: bool
  consentMarketing: bool = False


class UserLogin(BaseModel):
  email: EmailStr
  password: str


class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  first_name: str
  email: EmailStr