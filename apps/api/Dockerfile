FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .

RUN pip install --no-cache-dir --timeout 120 -e "."

COPY . .

RUN useradd --create-home --shell /bin/bash protocols && \
    chown -R protocols:protocols /app
USER protocols

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
