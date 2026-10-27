from fastapi import APIRouter
from app.schemas.finances import DashboardData

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