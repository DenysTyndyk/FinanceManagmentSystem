from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.finances import DashboardData, ExpenseCreate
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transaction import Transaction
from app.security import get_current_user_id

router = APIRouter(prefix="/finances", tags=["Finances"])


@router.get("/dashboard", response_model=DashboardData)
def get_dashboard_data():
    # Zwraca dane dokładnie odpowiadające stałym z Dashboard.jsx
    return {
        "balance": 8450.00,
        "income": 12200.00,
        "expenses": -3750.00,
        "trend_percentage": 12.5,
        "transactions": [
            {
                "id": 1,
                "title": "Biedronka - Zakupy spożywcze",
                "category": "Jedzenie",
                "when": "Dziś, 14:30",
                "amount": -145.50,
                "kind": "expense",
            },
            {
                "id": 2,
                "title": "Netflix Subscription",
                "category": "Rozrywka",
                "when": "Dziś, 09:00",
                "amount": -60.00,
                "kind": "expense",
            },
            {
                "id": 3,
                "title": "Wynagrodzenie - Październik",
                "category": "Przychód",
                "when": "Wczoraj, 08:15",
                "amount": 8200.00,
                "kind": "income",
            },
            {
                "id": 4,
                "title": "Orlen - Paliwo",
                "category": "Transport",
                "when": "23 Paź 2026",
                "amount": -250.00,
                "kind": "expense",
            },
        ],
        "group_summary": {
            "trip_name": "Wyjazd do Pragi",
            "participants_count": 3,
            "user_share_percentage": 40,
            "user_share_amount": 1200.00,
            "debtor_initials": "DF",
            "debtor_text": "zwraca Tobie",
            "debt_amount": 150.00,
        },
    }

@router.post("/expenses", status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: ExpenseCreate, 
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user_id)
):
    # Tworzenie rekordu w bazie na podstawie przesłanych danych
    new_transaction = Transaction(
        household_id=expense.household_id,
        user_id=user_id, # Pobierane bezpiecznie z tokena JWT, a nie z formularza
        category_id=expense.category_id,
        amount=expense.amount,
        currency=expense.currency,
        type="Expense",
        # Dla uproszczenia (przy braku przewalutowania) kwota bazowa jest równa kwocie wydatku
        base_amount=expense.amount,
        base_currency=expense.currency,
        exchange_rate=1.0,
        transaction_date=expense.transaction_date,
        description=expense.description
    )
    
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    return {
        "message": "Wydatek został pomyślnie dodany", 
        "transaction_id": new_transaction.id
    }