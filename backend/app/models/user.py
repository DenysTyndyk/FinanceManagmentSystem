from app.database import Base
from sqlalchemy import BigInteger, Column, DateTime, Enum, Integer, String, func


class User(Base):
  __tablename__ = "users"

  id = Column(BigInteger, primary_key=True, index=True)
  first_name = Column(String(100))
  last_name = Column(String(100))
  email = Column(String(255), unique=True, index=True, nullable=False)
  role = Column(Enum("User", "Admin", "Manager", name="user_role", create_type=False), nullable=False, server_default="User")
  status = Column(
      Enum("PendingVerification", "Active", "Suspended", "Deactivated", name="user_status", create_type=False),
      nullable=False,
      server_default="PendingVerification",
  )
  password_hash = Column(String(255), nullable=False)
  password_reset_token = Column(String(255))
  password_reset_expires_at = Column(DateTime(timezone=True))
  email_verified_at = Column(DateTime(timezone=True))
  failed_login_attempts = Column(Integer, nullable=False, server_default="0")
  locked_until = Column(DateTime(timezone=True))
  personal_household_id = Column(BigInteger, unique=True)
  email_verification_token = Column(String(255))
  email_verification_expires_at = Column(DateTime(timezone=True))
  created_at = Column(DateTime(timezone=True), server_default="now()")
  updated_at = Column(DateTime(timezone=True), server_default="now()", onupdate=func.now())
  deleted_at = Column(DateTime(timezone=True))
