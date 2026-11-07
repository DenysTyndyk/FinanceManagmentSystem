import os

# Testowy sekret ustawiany przed importem modułów aplikacji
os.environ.setdefault("JWT_SECRET", "test-secret-" + "x" * 40)
