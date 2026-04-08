# 🚀 Deployment Guide — Tic-Tac-Toe Nakama

Complete step-by-step guide to deploy the multiplayer Tic-Tac-Toe game to production.

---

## 📋 Prerequisites

- GitHub account with repository cloned
- Cloud provider account (DigitalOcean, AWS, GCP, Azure, or similar)
- Basic SSH/command-line knowledge
- Domain name (optional but recommended)

---

## 🔧 Backend Deployment (Nakama Server)

### Step 1: Prepare Nakama Module

Before deploying, ensure the backend module is compiled:

```bash
cd backend/nakama
npm install
npm run build
# Verify build/index.js exists (should be ~Xkb)
cd ../..
git add -A && git commit -m "Update compiled Nakama module"
git push origin main
```

### Step 2: Choose Cloud Provider & Setup Server

#### DigitalOcean (Recommended for this project)

1. **Create Droplet**:
   - Image: Ubuntu 22.04 x64
   - Plan: Basic ($5/month or Docker-ready preset)
   - Region: Closest to your users
   - Click "Create Droplet"

2. **SSH into your droplet**:
   ```bash
   ssh root@<YOUR_DROPLET_IP>
   ```

3. **Install Docker**:
   ```bash
   # Update packages
   apt update && apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker root
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **Clone the repository**:
   ```bash
   cd /opt
   git clone https://github.com/Madhu2003smita/tic-tac-toe.git
   cd tic-tac-toe/backend
   ```

5. **Start Nakama**:
   ```bash
   docker-compose up -d
   docker-compose logs nakama # Verify it's running
   ```

6. **Configure Firewall**:
   ```bash
   # Open required ports
   ufw allow 22/tcp          # SSH
   ufw allow 7350/tcp        # Nakama API (HTTP)
   ufw allow 7351/tcp        # Nakama Console (HTTP)
   ufw allow 7349/tcp        # Nakama gRPC
   ufw enable
   ufw status
   ```

#### AWS EC2

1. Launch **t3.small** or **t2.small** instance (Ubuntu 22.04)
2. Create Security Group:
   - Allow 22 (SSH), 7350, 7351, 7349 from anywhere
3. SSH in: `ssh -i your-key.pem ubuntu@<public-ip>`
4. Follow Docker installation steps (same as DigitalOcean)
5. Clone and run `docker-compose up -d`

#### GCP Compute Engine

1. Create **e2-medium** VM (Ubuntu 22.04)
2. Create Firewall Rule:
   - Allow TCP: 22, 7350, 7351, 7349
3. SSH via GCP Console or local SSH client
4. Follow Docker installation steps
5. Clone and run `docker-compose up -d`

---

### Step 3: Verify Backend is Running

Access the Nakama console (should see login screen):

```
http://<YOUR_SERVER_IP>:7351
```

Login with default credentials:
- Username: `admin`
- Password: `password`

> ⚠️ **Change these credentials in production!**

---

### Step 4: Setup Custom Domain (Optional)

If using a domain:

```bash
# Install Certbot for HTTPS
sudo apt install certbot

# You'll set this up with frontend deployment below
```

---

## 🌐 Frontend Deployment

### Option 1: Vercel (Easiest)

1. **Sign up** at https://vercel.com with your GitHub account
2. **Import project**:
   - Click "New Project"
   - Select your GitHub repository
   - Framework: Vite
   - Root Directory: `frontend`

3. **Set environment variables**:
   - Go to Settings → Environment Variables
   - Add:
     ```
     VITE_NAKAMA_HOST=your-server-ip-or-domain
     VITE_NAKAMA_PORT=7350
     VITE_NAKAMA_KEY=defaultkey
     VITE_NAKAMA_SSL=false  (or true if using HTTPS)
     ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy
   - Get your URL: `https://your-project.vercel.app`

5. **Update for every backend change** (if IP changes):
   - Update Settings → Environment Variables
   - Redeploy

---

### Option 2: Netlify

1. **Sign up** at https://netlify.com with GitHub
2. **New site from Git**:
   - Select your repo
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`

3. **Set env variables**:
   - Site Settings → Build & deploy → Environment
   - Add `VITE_*` variables

4. **Deploy** and get your live URL

---

### Option 3: AWS S3 + CloudFront (Advanced)

1. Build locally:
   ```bash
   cd frontend
   npm run build
   # Creates dist/
   ```

2. Upload to S3:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name/
   ```

3. CloudFront distribution to your S3 bucket
4. Point domain to CloudFront

---

### Option 4: Your Own VPS (DigitalOcean App Platform)

1. Create new App on DigitalOcean
2. Connect GitHub repo
3. Configure build: `cd frontend && npm run build`
4. Publish: `frontend/dist`
5. Set env variables via UI
6. Click "Create App" — auto-deploys on every push

---

## 🔐 HTTPS / SSL Setup

### For Backend (Nginx Reverse Proxy + Let's Encrypt)

```bash
# On your backend server
apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
cat > /etc/nginx/sites-available/tictactoe << 'EOF'
server {
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:7350;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/tictactoe /etc/nginx/sites-enabled/

# Get SSL certificate
certbot --nginx -d your-domain.com

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

Then update frontend env:
```
VITE_NAKAMA_HOST=your-domain.com
VITE_NAKAMA_PORT=443
VITE_NAKAMA_SSL=true
```

---

## 🧪 Testing Production Deployment

1. **Test backend**:
   ```bash
   curl http://your-server:7350/v2/healthhttp your-server:7350/v2/health
   # Should return 200 OK
   ```

2. **Test frontend**:
   - Open the frontend URL
   - Check browser console for connection errors
   - Try creating a match

3. **Full multiplayer test**:
   - Open frontend in two different browsers
   - Each clicks "Find Match"
   - Both should connect to same game
   - Try making moves — should work seamlessly

4. **Load test** (optional):
   ```bash
   # Using Apache Bench
   ab -n 100 -c 10 http://your-server:7350/v2/health
   ```

---

## 📊 Monitoring & Maintenance

### Check Logs
```bash
# Nakama logs
docker logs nekama -f

# See all containers
docker ps

# Restart if needed
docker-compose restart
```

### Backup Database
```bash
# Backup PostgreSQL
docker exec postgres pg_dump -U postgres nakama > nakama_backup.sql

# Restore if needed
docker exec -i postgres psql -U postgres nakama < nakama_backup.sql
```

### Update Code
```bash
cd /opt/tic-tac-toe
git pull origin main
docker-compose down
docker-compose up -d
```

---

## 🆘 Common Issues

### Backend unreachable from frontend
- Check firewall allows port 7350: `ufw status`
- Check Nakama is running: `docker ps | grep nakama`
- Verify env var `VITE_NAKAMA_HOST` is correct

### "Connection refused" on 7350
- Nakama may have crashed: `docker logs nakama`
- Check PostgreSQL is running: `docker ps | grep postgres`

### SSL certificate issues
- Renew: `certbot renew --dry-run` then `certbot renew`
- Check Nginx: `systemctl status nginx`

### Database corruption
- Restore from backup
- Or reset: `docker-compose down -v` (⚠️ deletes all data)

---

## 💰 Cost Estimation

| Provider | Instance | Month |
|----------|----------|-------|
| DigitalOcean | $5 Droplet | ~$5 |
| AWS | t2.micro (free tier) | Free (1 year) |
| Vercel | Free tier | Free |
| Netlify | Free tier | Free |
| **Total (minimal)** | - | **~$5/month** |

---

## 🎉 You're Live!

Once deployed:
1. Share your frontend URL with players
2. Watch real-time games happening
3. Celebrate! 🚀

For questions or issues, refer to:
- Nakama Docs: https://heroiclabs.com/docs/
- GitHub Issues: https://github.com/Madhu2003smita/tic-tac-toe/issues

