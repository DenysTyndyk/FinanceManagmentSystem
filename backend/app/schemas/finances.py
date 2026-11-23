from typing import Annotated, List, Literal, Optional
from pydantic import BaseModel, Field, StringConstraints
from datetime import date
from decimal import Decimal


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
    limit: Optional[float] = None
    color: str


class CategoryItem(BaseModel):
    id: int
    slug: str
    name: str
    usage_count: int = 0  # liczba wydatków użytkownika w tej kategorii
    is_own: bool = False  # własna kategoria użytkownika (nie systemowa)
    color: Optional[str] = None  # kolor w formacie #RRGGBB


class CategoryCreate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")  # kolumna categories.color to varchar(7)


class ExpenseListItem(BaseModel):
    id: int
    title: str
    category: str
    category_id: int
    transaction_date: date
    amount: float


class LimitUpdate(BaseModel):
    limit_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    household_id: int


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
