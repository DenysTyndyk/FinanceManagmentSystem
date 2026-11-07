# Finance Management System

Aplikacja webowa do osobistego budżetu i wspólnych wydatków z przyjaciółmi.

## Stack

- **Frontend:** React, JavaScript (Vite)
- **Backend:** Python, FastAPI (JWT)
- **Baza danych:** PostgreSQL 16
- **Uruchamianie:** Docker, Docker Compose

## Schemat bazy danych

Diagram: https://dbdiagram.io/d/6a74864035ee2e87b048a95a

Pliki w folderze `database/`:

- `schema.sql` — tworzenie tabel, typów enum, indeksów i ograniczeń.
- `seed_test_data.sql` — dane testowe (6 użytkowników, wspólne gospodarstwo, transakcje itd.).

Migracje dla istniejącej bazy leżą w `database/migrations/` (uruchamiane ręcznie, po kolei):

```bash
psql "postgresql://finance:finance@localhost:5432/finance" -f database/migrations/001_auth_sessions.sql
```

## Uwierzytelnianie

- Rejestracja → e-mail z linkiem aktywacyjnym (`/weryfikacja?token=...`) → logowanie.
- Token dostępowy JWT (15 min) trzymany w pamięci frontendu, sesja odnawiana ciasteczkiem httpOnly
  z tokenem odświeżającym (7 dni, rotowany przy każdym użyciu, unieważniany przy wylogowaniu).
- 5 nieudanych logowań blokuje konto na 15 min; limity żądań na IP dla logowania, rejestracji i resetu hasła.
- Reset hasła: `/zapomniane-haslo` → link e-mail → `/reset-hasla?token=...` (wylogowuje wszystkie urządzenia).
- Bez `SMTP_HOST` (tryb dev) treść e-maili z linkami trafia do logów: `docker compose logs -f backend`.
- Zdarzenia bezpieczeństwa (logowania, blokady, resety) są logowane przez logger `app.auth`.
- Produkcja: HTTPS przed backendem i frontendem, `COOKIE_SECURE=true`, właściwe `FRONTEND_URL`,
  `CORS_ORIGINS`, `VITE_API_URL` i dane SMTP.

## Szybki start

1. Skopiuj `.env.example` do `.env` i uzupełnij wartości (`JWT_SECRET` ustaw własny).
2. Uruchom całe środowisko:

   ```bash
   docker compose up --build
   ```

   Albo w tle:

   ```bash
   docker compose up -d
   ```

3. Adresy po uruchomieniu:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000
   - Swagger (OpenAPI): http://localhost:8000/docs

4. Zatrzymanie:

   ```bash
   docker compose down
   ```

## Lokalne uruchamianie bez Dockera

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Testy i lintowanie

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run lint
```
