# Finance Management System — AI Assistant Guide

## Project Overview
Web application for personal budget tracking and split-cost management with friends.
- **Frontend**: React, JavaScript
- **Backend**: Python (REST API, JWT Authentication)
- **Database**: PostgreSQL
- **Environment**: Docker, Docker Compose
- **Key Integrations**: NBP API (currency exchange)

## Architecture & Design Guidelines
- **API Style**: RESTful endpoints returning consistent JSON structures.
- **Authentication**: JWT-based access tokens passed via standard authorization headers.
- **API Documentation**: Interactive OpenAPI / Swagger (`/docs`) must stay updated with every new endpoint.
- **Database Migrations**: Every schema update must include appropriate migration scripts.
- **Performance Constraint**: Database queries and standard API reads must complete within 500ms.
- **Manual Execution Only (CRITICAL)**: Do NOT execute bash commands, scripts, migrations, or database queries automatically. Provide all terminal commands and SQL queries as explicit, copy-pasteable instructions — the user will run them manually.
- **Database Access Control**: Claude has strictly no direct access to the database. All queries, inspection, schema updates, and seedings must be provided to the user to execute manually.
- **Documentation**: must be on Polish language 
## Non-Negotiable Rules & Standards

### 1. Code Comments (CRITICAL)
- **Language**: All inline comments, docstrings, and module descriptions **MUST be written in Polish** (as specified in NF-04).
- **Code identifiers**: Variable, function, and class names must remain in standard English (e.g., `calculate_balance()`, `UserWallet`).

### 2. External API Resilience (NBP API)
- Always implement a fallback mechanism when calling currency exchange rates.
- If the NBP service is down or unreachable, fall back to the most recently cached exchange rate in PostgreSQL without crashing the request (NF-06)

### 3. Security
- Never store raw passwords. Always hash credentials using `bcrypt` or an equivalent strong cryptographic standard (NF-02).

## File Access & Environment Restrictions
- **Sensitive Files (STRICT)**: Never read, display, or log `.env`, `.env.local`, or any files containing private keys, credentials, or production tokens. Instead, only reference or update template files like `.env.example`.
- **Ignored Directories**: Do NOT read, search, or index heavy generated or dependency directories (e.g., `node_modules/`, `venv/`, `.venv/`, `__pycache__/`, `build/`, `dist/`, `.git/`, `.idea/`).
- **Heavy & Generated Files**: Do NOT inspect large lockfiles (`package-lock.json`, `yarn.lock`, `poetry.lock`), binary assets, or database dump files (`.sql`, `.dump`). Focus exclusively on relevant source code.

## Development & Execution Commands

### Docker (Preferred Runtime)
```bash
# Build and run entire environment
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop environment
docker-compose down

# Install dependencies
pip install -r requirements.txt

# Run migrations
# (Update command depending on framework: Alembic/Django)
alembic upgrade head

# Run tests
pytest

# Install dependencies
npm install

# Start development server
npm run start

# Run tests / linting
npm test
npm run lint