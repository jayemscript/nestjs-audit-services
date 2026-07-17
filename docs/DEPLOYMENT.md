# Deployment Guide

This service ships as a single Docker image, so it deploys the same way to **any** container platform. Two paths are documented here: **EC2 (or any self-hosted server)** using the full `docker-compose.yaml` stack, and **Render**, which builds only the `Dockerfile` and expects Mongo/Redis as external managed services.

---

## Important: Render does NOT run `docker-compose.yaml`

Render's Docker-based web services build and run a single `Dockerfile` — they do not read or execute `docker-compose.yaml`. That means on Render:

- ❌ No containerized Mongo or Redis will spin up automatically.
- ✅ You must point `MONGO_URI` at MongoDB Atlas (or another managed Mongo) and `REDIS_URL` at a managed Redis (Render's own Key Value service, Upstash, Redis Cloud, etc).

On **EC2** (or any VM/server you control), `docker-compose.yaml` runs the full stack — app, Mongo, and Redis containers together — which is why the compose file includes `mongo` and `redis` services with root auth.

---

## Option A — Deploy to EC2 / self-hosted server (full stack via docker-compose)

### 1. Copy files to the server

Make sure these are present on the EC2 instance:
- `Dockerfile`
- `docker-compose.yaml`
- `.dockerignore`
- Your `.env` (copy from `.env.example` and fill in real secrets — **never commit this file**)

### 2. Install Docker + Docker Compose on EC2 (if not already)

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

### 3. Configure `.env`

```bash
cp .env.example .env
nano .env   # fill in MONGO_ROOT_USER, MONGO_ROOT_PASSWORD, REDIS_PASSWORD,
            # COOKIE_SECRET, API_KEYS, CORS_ORIGINS, etc.
```

Leave `MONGO_URI=mongodb://localhost:27017` as-is in `.env` for this path — `docker-compose.yaml` overrides it automatically at runtime to point at the containerized `mongo` service with the root credentials you set.

### 4. Build & run

```bash
docker compose up -d --build
```

### 5. Verify

```bash
docker compose ps
docker compose logs -f audit-service
curl http://localhost:7004/
```

### 6. Updating after code changes

```bash
git pull
docker compose up -d --build
```

### 7. (Recommended) Put Nginx or a load balancer in front

For production EC2 setups, put Nginx (or an AWS ALB) in front of the container to handle TLS termination, and forward to `127.0.0.1:7004`. Your `main.ts` already calls `expressApp.set('trust proxy', 1)`, so `X-Forwarded-*` headers from a reverse proxy are respected correctly.

---

## Option B — Deploy to Render (Docker web service + managed Mongo/Redis)

### 1. Provision managed databases first

- **MongoDB**: create a free/paid cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), grab the `mongodb+srv://...` connection string, and add your Render service's outbound IPs (or `0.0.0.0/0` for simplicity, tightened later) to Atlas's Network Access list.
- **Redis**: use Render's own **Key Value** (Redis-compatible) service, or an external provider like Upstash/Redis Cloud. Grab the connection URL and password.

### 2. Connect your repo to Render

- Push this repo (including `Dockerfile` and `render.yaml`) to GitHub/GitLab.
- In Render: **New → Blueprint**, point it at your repo. Render will read `render.yaml` and provision the web service automatically.

Alternatively, without Blueprint: **New → Web Service → Docker**, point at the repo, and Render will detect the `Dockerfile` directly.

### 3. Set environment variables in the Render dashboard

`render.yaml` marks these as `sync: false`, meaning Render won't auto-fill them — set them manually under **Environment**:

| Key | Value |
|---|---|
| `MONGO_URI` | Your Atlas `mongodb+srv://...` string |
| `REDIS_URL` | Your managed Redis URL |
| `REDIS_PASSWORD` | Your managed Redis password |
| `COOKIE_SECRET` | A strong random string |
| `CORS_ORIGINS` | Comma-separated list of allowed origins |
| `API_KEYS` | Comma-separated list of client API keys |

### 4. Deploy

Render builds the `Dockerfile`'s `production` stage and starts the container, health-checking `/` per `render.yaml`'s `healthCheckPath`.

### 5. Verify

```bash
curl https://<your-render-service>.onrender.com/
```

---

## Quick Reference

| | EC2 / self-hosted | Render |
|---|---|---|
| Runs `docker-compose.yaml`? | ✅ Yes — full stack | ❌ No — Dockerfile only |
| Mongo | Containerized (root auth via `.env`) | External (Atlas) |
| Redis | Containerized (password via `.env`) | External (Render Key Value / Upstash / etc) |
| TLS | You configure (Nginx/ALB) | Handled automatically by Render |
| Scaling | Manual / your own orchestration | Render's built-in scaling controls |

Both paths use the exact same `Dockerfile`, so the compiled app behaves identically in either environment — only where Mongo/Redis physically live differs.