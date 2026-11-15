from typing import List, Literal, Optional
from pydantic import BaseModel
from datetime import date


class ExpenseCreate(BaseModel):
    amount: float
    currency: str = "PLN"
    category_id: int
    transaction_date: date
    description: Optional[str] = None
    household_id: int


class TransactionItem(BaseModel):
    id: int
    title: str
    category: str
    categoryId: str  # Dodane dla frontendu
    when: str
    amount: float
    kind: Literal["expense", "income"]


class GroupSettlement(BaseModel):
    trip_name: str
    participants_count: int
    user_share_percentage: int
    user_share_amount: float
    debtor_initials: str
    debtor_text: str
    debt_amount: float


class CategoryLimitItem(BaseModel):
    id: str
    label: str
    spent: float
    limit: float
    color: str


class DashboardData(BaseModel):
    balance: float
    income: float
    expenses: float
    trend_percentage: float
    transactions: List[TransactionItem]
    category_limits: List[CategoryLimitItem] # Nowe pole przekazujące limity z bazy
    group_summary: GroupSettlement


class DayExpenseItem(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    category_id: Optional[str] = None


class DailyReportItem(BaseModel):
    date: str  # Format: YYYY-MM-DD
    day: int
    total_amount: float
    count: int
    transactions: List[DayExpenseItem]


class ChartBarItem(BaseModel):
    day: str  # Etykieta słupka (np. '1 Paź' lub 'Pon')
    weight: int  # Waga słupka 0-100 dla wykresu
    solid: bool = True
    amount: float = 0.0


class ReportsData(BaseModel):
    month: str  # Format: YYYY-MM
    total_expenses: float
    max_daily_expense: float
    daily_expenses: List[DailyReportItem]
    chart_month_bars: List[ChartBarItem]
    chart_week_bars: List[ChartBarItem]
