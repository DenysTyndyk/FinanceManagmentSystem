from app.database import Base
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, Numeric, String, func

class ReceiptItem(Base):
    __tablename__ = "receipt_items"
    
    id = Column(BigInteger, primary_key=True, index=True)
    receipt_id = Column(BigInteger, ForeignKey("receipts.id"), nullable=False, index=True)
    transaction_id = Column(BigInteger, ForeignKey("transactions.id"), unique=True)
    name = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())