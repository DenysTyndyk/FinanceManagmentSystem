# Główny punkt wejścia API.
from fastapi import FastAPI

app = FastAPI(title="Aplikacja do zarządzania finansami")


@app.get("/health")
def health():
    # Kontrola, czy serwis odpowiada.
    return {"status": "ok"}
