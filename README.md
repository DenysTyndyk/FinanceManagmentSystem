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

## Inicjalizacja bazy danych

Po pierwszym uruchomieniu kontenera `db` zastosuj schemat:

```bash
docker compose exec -T db psql -U finance -d finance < database/schema.sql
```

Aby dodać dane testowe (tylko dla bazy dev/test):

```bash
docker compose exec -T db psql -U finance -d finance < database/seed_test_data.sql
```

Konta testowe mają zastępcze hasła, więc nie zalogujesz się na nie prawdziwym hasłem.

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
