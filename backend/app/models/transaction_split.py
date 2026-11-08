from app.database import Base
from sqlalchemy import BigInteger, Column, ForeignKey, Numeric

class TransactionSplit(Base):
    __tablename__ = "transaction_splits"
    
    id = Column(BigInteger, primary_key=True, index=True)
    transaction_id = Column(BigInteger, ForeignKey("transactions.id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)
    share_amount = Column(Numeric(12, 2), nullable=False)