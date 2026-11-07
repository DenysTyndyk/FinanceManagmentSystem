from datetime import datetime
from app.database import Base
from sqlalchemy import Column, BigInteger, Integer, String, Numeric, Date, ForeignKey, DateTime

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(BigInteger, primary_key=True, index=True)
    household_id = Column(BigInteger, nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='PLN')
    type = Column(String, nullable=False) # 'Expense', 'Income', 'Transfer'
    base_amount = Column(Numeric(12, 2), nullable=False)
    base_currency = Column(String(3), nullable=False, default='PLN')
    exchange_rate = Column(Numeric(12, 6), nullable=False, default=1)
    transaction_date = Column(Date, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)