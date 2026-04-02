# Python ML Service Dockerfile for LendSmart Credit Risk Models

FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 mluser

# Copy requirements
COPY requirements.txt .

# ─── Development ──────────────────────────────────────────────────────────────
FROM base AS development
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chown -R mluser:mluser /app
USER mluser
EXPOSE 8000
CMD ["python", "prediction_service.py"]

# ─── Production ───────────────────────────────────────────────────────────────
FROM base AS production
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

COPY --chown=mluser:mluser . .
RUN mkdir -p models logs && chown -R mluser:mluser models logs

USER mluser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "prediction_service.py"]

LABEL maintainer="LendSmart Team <dev@lendsmart.com>"
LABEL version="2.0.0"
LABEL description="LendSmart Credit Risk ML Service"
