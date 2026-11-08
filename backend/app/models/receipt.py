from app.database import Base
from sqlalchemy import BigInteger, Column, Date, DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(BigInteger, primary_key=True, index=True)
    household_id = Column(BigInteger, ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True)
    payer_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    created_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    status = Column(Enum("Uploaded", "Processed", "Failed", name="receipt_status"), nullable=False, server_default="Uploaded")
    merchant = Column(String(150))
    receipt_date = Column(Date)
    total_amount = Column(Numeric(12, 2))
    currency = Column(String(3), nullable=False, server_default="PLN")
    raw_text = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())