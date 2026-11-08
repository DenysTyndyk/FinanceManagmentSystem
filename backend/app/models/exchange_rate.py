from app.database import Base
from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String, func

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    currency_code = Column(String(3), nullable=False)
    rate = Column(Numeric(12, 6), nullable=False)
    effective_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())