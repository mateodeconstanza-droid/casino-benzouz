# --- Stage 1: build the React frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Install deps first to leverage Docker layer caching
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

# Copy source and build
COPY frontend/ ./
# Empty REACT_APP_BACKEND_URL → frontend uses window.location.origin (single-site deploy)
ENV REACT_APP_BACKEND_URL=""
ENV CI=false
RUN yarn build


# --- Stage 2: Python runtime serving API + WebSockets + static frontend ---
FROM python:3.11-slim
WORKDIR /app

# System deps for native wheels (jq, cryptography, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    autoconf \
    automake \
    libtool \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/build ./frontend/build

ENV FRONTEND_BUILD_DIR=/app/frontend/build
ENV PORT=8000
EXPOSE 8000

WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
