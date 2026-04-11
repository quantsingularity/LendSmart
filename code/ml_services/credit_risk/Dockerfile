# LendSmart Credit Risk ML Service
# Python 3.11 – scikit-learn, XGBoost, LightGBM, SHAP, Flask

FROM python:3.11-slim AS base

WORKDIR /app

# System dependencies for numpy/scipy build wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r mluser && useradd -r -g mluser mluser

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY ml_services/credit_risk/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ─── Production ───────────────────────────────────────────────────────────────
FROM deps AS production

# Copy the full ml_services package so package-relative imports work
COPY ml_services/ /app/ml_services/
RUN touch /app/ml_services/__init__.py

# Create directories for models and logs
RUN mkdir -p /app/saved_models /app/logs && \
    chown -R mluser:mluser /app

USER mluser
WORKDIR /app

ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["python", "-m", "ml_services.credit_risk.prediction_service", "--server", "--host", "0.0.0.0", "--port", "8000"]

LABEL maintainer="LendSmart Team <dev@lendsmart.com>"
LABEL version="2.0.0"
LABEL description="LendSmart - Credit Risk ML Prediction Service"
