# NurseFlow — Deployment Architecture & Production Configuration
## Final Year Engineering Technical Documentation

---

### 1. Unified Single-Service Deployment Architecture

NurseFlow is architected as a **unified full-stack application**. The Express backend serves both the REST API endpoints (`/api/*`) and statically serves the compiled React production SPA bundle from `client/dist`. 

This eliminates CORS issues and simplifies hosting to a single cloud container or VPS process.

```mermaid
graph TD
    ClientBrowser[Client Web Browser] -->|HTTPS Requests| ReverseProxy[Nginx / Cloudflare / Caddy]
    ReverseProxy -->|Port 5000| ExpressServer[Express 5 Node.js Server]
    ExpressServer -->|/api/*| APIRoutes[REST API Handlers & Controllers]
    ExpressServer -->|/* (Fallback)| StaticBundle[Static React SPA Bundle (client/dist)]
    APIRoutes --> DB[(SQLite DB with WAL / PostgreSQL)]
```

---

### 2. Environment Variables Specification

Create a production `.env` file based on `.env.example`:

| Variable | Description | Example / Recommended Setting |
| :--- | :--- | :--- |
| `PORT` | Listening server port | `5000` (or `10000` on Render) |
| `NODE_ENV` | Environment mode | `production` |
| `JWT_SECRET` | 256-bit cryptographic secret for session tokens | *(Generate with `openssl rand -hex 32`)* |
| `DATABASE_URL` | Relational database connection string | `file:./data/nurseflow.db` or PostgreSQL URI |
| `VITE_API_BASE_URL` | Client API endpoint prefix | `/api` |

---

### 3. Production Deployment Options

#### Option A: Docker & Docker Compose (Recommended)
```bash
# 1. Build and launch container in background
docker compose up -d --build

# 2. Check operational logs
docker logs -f nurseflow-app
```
Data persistence is guaranteed by the named volume `nurseflow-data` mounted at `/app/data`.

#### Option B: Render.com / Railway.app
1. Connect Git repository to Render.
2. Select **Web Service**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
3. Add a persistent disk mounted to `/app/data` (size: 1 GB).
4. Set `NODE_ENV=production` and `JWT_SECRET`.

#### Option C: Vercel + Managed Cloud PostgreSQL (Neon / Supabase)
1. Point `DATABASE_URL` to managed PostgreSQL instance.
2. The client SPA deploys via Vercel with output directory `client/dist`.
3. Serverless API routes deploy via `vercel.json` rewrite configuration.

---

### 4. Production Build & Health Check

Verify production readiness before deployment:
```bash
# 1. Run type checks
npm run build

# 2. Run automated test suite
npm test

# 3. Seed demo dataset
npm run seed

# 4. Start production server
npm start
```
Health endpoint test:
```bash
curl http://localhost:5000/api/auth/demo-users
```
Returns HTTP 200 with JSON payload of available clinical personas.
