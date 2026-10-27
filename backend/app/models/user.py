from datetime import datetime
from app.database import Base
from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String


class User(Base):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True, index=True)
  first_name = Column(String(100), nullable=False)
  last_name = Column(String(100), nullable=False)
  email = Column(String(255), unique=True, index=True, nullable=False)
  hashed_password = Column(String(255), nullable=False)
  birth_date = Column(Date, nullable=True)
  consent_personal = Column(Boolean, default=False, nullable=False)
  consent_marketing = Column(Boolean, default=False, nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow)