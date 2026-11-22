# Deutschly Deployment Guide (Contabo VPS)

This guide documents deploying Deutschly to a self-hosted Contabo VPS using Docker Compose, PostgreSQL 16, and Nginx with free Let's Encrypt SSL.

---

## 1. Prerequisites on Contabo VPS

* Ubuntu 22.04 LTS or 24.04 LTS.
* Docker and Docker Compose plugin installed:
  ```bash
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose-plugin
  sudo systemctl enable --now docker
  ```
* Domain or subdomain DNS A-record pointing to your VPS IP address (e.g. `deutsch.yourdomain.com`).

---

## 2. Deployment Steps

### Step 1: Clone Repository
```bash
git clone https://github.com/hsmoallem/Deutschly.git /var/www/deutschly
cd /var/www/deutschly
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and set strong passwords:
```bash
cp .env.example .env
nano .env
```
Ensure:
* `POSTGRES_USER`
* `POSTGRES_PASSWORD`
* `JWT_SECRET`
* `NEXT_PUBLIC_APP_URL` are configured with production values.

### Step 3: Launch Containers via Docker Compose
```bash
docker compose up -d --build
```
Verify all services are running:
```bash
docker compose ps
```

### Step 4: Run Database Migrations & Initial Seed
```bash
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

### Step 5: Obtain Free SSL Certificate via Certbot
```bash
sudo apt-get install -y certbot
sudo certbot certonly --webroot -w /var/www/certbot -d deutsch.yourdomain.com
```

---

## 3. Database Backup & Restore Operations

### Daily Automated Backup
Add a cron job to run the backup script every night at 2:00 AM:
```bash
crontab -e
# Add line:
0 2 * * * /var/www/deutschly/scripts/backup_db.sh >> /var/log/deutschly_backup.log 2>&1
```

### Manual Backup
```bash
./scripts/backup_db.sh
```

### Restoring from Backup
```bash
./scripts/restore_db.sh ./backups/deutschly_backup_YYYYMMDD_HHMMSS.sql.gz
```
