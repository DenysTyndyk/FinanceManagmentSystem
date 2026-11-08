from app.database import Base
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Numeric, String, func

class Settlement(Base):
    __tablename__ = "settlements"
    
    id = Column(BigInteger, primary_key=True, index=True)
    household_id = Column(BigInteger, ForeignKey("households.id"), nullable=False, index=True)
    payer_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, server_default="PLN")
    settled_at = Column(DateTime(timezone=True), server_default=func.now())