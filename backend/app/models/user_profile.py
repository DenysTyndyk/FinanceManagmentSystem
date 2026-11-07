from app.database import Base
from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, ForeignKey, String


class UserProfile(Base):
  __tablename__ = "user_profiles"

  id = Column(BigInteger, primary_key=True, index=True)
  user_id = Column(BigInteger, ForeignKey("users.id"), unique=True, nullable=False)
  phone_number = Column(String(18))
  date_of_birth = Column(Date)
  preferred_language = Column(String(10), server_default="pl")
  preferred_chart = Column(String(20), nullable=False, server_default="pie")
  consent_personal_data = Column(Boolean, nullable=False, server_default="false")
  consent_marketing = Column(Boolean, nullable=False, server_default="false")
  consent_updated_at = Column(DateTime(timezone=True))
  created_at = Column(DateTime(timezone=True), server_default="now()")
  updated_at = Column(DateTime(timezone=True), server_default="now()")
