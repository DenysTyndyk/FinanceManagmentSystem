from app.database import Base
from sqlalchemy import BigInteger, Boolean, Column, DateTime, String, func

class Household(Base):
    __tablename__ = "households"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    currency = Column(String(3), nullable=False, server_default="PLN")
    is_personal = Column(Boolean, nullable=False, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())