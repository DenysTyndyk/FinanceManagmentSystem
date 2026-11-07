from app.database import Base
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, func


class RefreshToken(Base):
  """Sesja użytkownika: skrót tokena odświeżającego przechowywanego w ciasteczku httpOnly."""

  __tablename__ = "refresh_tokens"

  id = Column(BigInteger, primary_key=True)
  user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
  token_hash = Column(String(64), nullable=False, unique=True)
  expires_at = Column(DateTime(timezone=True), nullable=False)
  revoked_at = Column(DateTime(timezone=True))
  created_ip = Column(String(45))
  user_agent = Column(String(255))
  created_at = Column(DateTime(timezone=True), server_default=func.now())
