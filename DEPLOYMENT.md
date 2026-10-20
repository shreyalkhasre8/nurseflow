# NurseFlow — Deployment Guide

NurseFlow is architected as a **unified full-stack application**. The Express backend serves both the REST API (`/api/*`) and statically serves the compiled React production frontend from `client/dist`. 

This means **you only need to run and host a single service**!

---

## 📋 Pre-Deployment Checklist

1. **Environment Variables**:
   Copy `.env.example` to `.env` and set a secure `JWT_SECRET`:
   ```bash
   cp .env.example .env
   ```
2. **Persistent Storage for Database**:
   NurseFlow uses SQLite (`data/nurseflow.db`). Ensure the `data/` folder is mounted to a persistent volume or disk so patient records and registers persist across restarts.
3. **Automatic Database Seeding**:
   On the very first launch, if the database is empty, NurseFlow automatically creates the relational schema and seeds sample departments, wards, users, tasks, and registers.

---

## 🚀 Option 1: Docker / Docker Compose (Recommended)

This is the fastest, cleanest, and most reliable method for any Linux VPS, cloud server, or hospital local server.

### 1. Build and Run Container
From the project root:
```bash
docker compose up -d --build
```

### 2. Verify Deployment
```bash
docker ps
docker logs -f nurseflow-app
```
Your application will be live at:
- **`http://localhost:5000`** (or your server's IP address: `http://<SERVER_IP>:5000`)

To stop or restart:
```bash
docker compose down
docker compose up -d
```
All patient data and register records are safely persisted in the `nurseflow-data` Docker volume.

---

## ☁️ Option 2: Cloud Platform (Render.com / Railway.app)

### Deploying to Render
1. Push your repository to GitHub or GitLab.
2. In Render Dashboard, click **New +** ➔ **Web Service**.
3. Select your repository.
4. Set the following configuration:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Under **Advanced** ➔ **Disks**:
   - Click **Add Disk**
   - **Name**: `nurseflow-data`
   - **Mount Path**: `/app/data` (or `./data`)
   - **Size**: `1 GB` (sufficient for millions of clinical register entries)
6. Under **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: *(Generate a secure random string)*
7. Click **Create Web Service**.

---

## 🖥️ Option 3: Traditional Linux VPS / Ubuntu Server (Nginx + PM2)

Ideal for AWS EC2, DigitalOcean Droplets, Linode, Hetzner, or private hospital virtual machines.

### 1. Install Node.js 20+ and Build Tools
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
sudo npm install -g pm2
```

### 2. Clone and Build the Application
```bash
git clone <your-repo-url> /var/www/nurseflow
cd /var/www/nurseflow
npm install
npm run build
```

### 3. Start with PM2 Process Manager
```bash
# Start NurseFlow in production
pm2 start "npm start" --name "nurseflow"

# Configure PM2 to start on system boot
pm2 startup
pm2 save
```

### 4. Configure Nginx Reverse Proxy
Install Nginx:
```bash
sudo apt update && sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/nurseflow`:
```nginx
server {
    listen 80;
    server_name nurseflow.yourhospital.org; # or your server IP

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/nurseflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Enable SSL / HTTPS (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nurseflow.yourhospital.org
```

---

## 🏥 Option 4: Hospital Intranet / Local Area Network (LAN)

If deploying inside a clinic or hospital without exposing the app to the public internet:

1. Follow **Option 1 (Docker)** or **Option 3 (PM2)** on a server machine connected to the hospital local network.
2. Note the internal static IP address of the server (e.g., `192.168.1.50`).
3. Allow incoming traffic on port `5000` (or port `80`/`443` if using Nginx) through the firewall:
   - **Linux UFW**: `sudo ufw allow 5000/tcp`
   - **Windows Firewall**: Inbound Rules ➔ New Rule ➔ Port ➔ TCP 5000 ➔ Allow Connection.
4. Any nurse workstation, tablet, or doctor computer connected to the hospital Wi-Fi or Ethernet can now open:
   ```
   http://192.168.1.50:5000
   ```

---

## 🛡️ Production Security & Backup Recommendations

1. **Database Backups**:
   The entire database is stored in `data/nurseflow.db`. Because SQLite uses WAL (Write-Ahead Logging), you can create an atomic online backup without stopping the server:
   ```bash
   sqlite3 data/nurseflow.db ".backup data/backup_$(date +%Y%m%d_%H%M%S).db"
   ```
   You can add this to a daily cron job.
2. **Session Security**:
   Always set a unique random string for `JWT_SECRET` in `.env`.
3. **Audit Compliance**:
   NurseFlow automatically writes every clinical action (logins, task completions, register corrections, stock issues) to the `audit_logs` table.
