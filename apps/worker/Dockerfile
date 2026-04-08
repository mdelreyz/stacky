FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY apps/api /app/apps/api
COPY apps/worker /app/apps/worker

RUN pip install --no-cache-dir --timeout 120 -r /app/apps/worker/requirements.txt && \
    pip install --no-cache-dir --timeout 120 -e /app/apps/api

WORKDIR /app/apps/worker
ENV PYTHONPATH=/app/apps/api:/app/apps/worker

RUN useradd --create-home --shell /bin/bash protocols && \
    chown -R protocols:protocols /app
USER protocols

CMD ["celery", "-A", "worker_app", "worker", "--loglevel=info"]
