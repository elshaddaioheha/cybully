FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860

# Hugging Face runs containers under user ID 1000. Set up user.
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# Copy python packaging configuration & source code from services/api
COPY services/api/pyproject.toml ./
COPY services/api/app ./app
RUN pip install .

# Copy database migration tools
COPY services/api/alembic.ini ./
COPY services/api/alembic ./alembic
COPY services/api/scripts ./scripts
RUN chmod +x ./scripts/start.sh

# Change ownership of app directory to user 1000
RUN chown -R user:user /home/user/app

USER user
EXPOSE 7860

# Start script automatically binds to PORT 7860 injected by Hugging Face
CMD ["./scripts/start.sh"]
