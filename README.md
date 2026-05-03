# Datasport Crawler

🚨 Monitor the [Datasport](https://www.datasport.de) triathlon registration page and get instant Telegram + email notifications when registration opens.

## What It Does

- Monitors the registration page every **5 seconds**
- Detects when the status changes from **"aktuell kein Platz verfügbar"** (no places available) to **open for registration**
- Sends instant **Telegram** and optional **email** notifications
- Detects blocks and warns you if the site starts blocking requests
- Persists state across restarts (no false alerts on reboot)

## Quick Start

```bash
# Clone
git clone https://github.com/mfkiraopenclaw/datasport-crawler.git
cd datasport-crawler

# Install
npm install

# Configure (edit with your values)
cp .env.example .env
nano .env

# Run
npm run dev

# Or build and run
npm run build
npm start
```

## Configuration

Create `.env` from `.env.example` and fill in your own:

```env
# Required: Telegram notifications
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Optional: Email notifications
EMAIL_NOTIFICATIONS=true
EMAIL_TO=your_email@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address
SMTP_PASS=your_app_password

# Advanced
POLL_INTERVAL_SECONDS=5
LOG_LEVEL=info
```

## Hostinger VPS Deployment

### Step 1: Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git

# Verify
node -v
npm -v
```

### Step 3: Clone and Setup

```bash
# Clone repository
cd /opt
git clone https://github.com/mfkiraopenclaw/datasport-crawler.git
cd datasport-crawler

# Install dependencies
npm install

# Build
npm run build
```

### Step 4: Configure

Create `.env` from `.env.example` with your actual credentials:

```bash
cp .env.example .env
nano .env
```

### Step 5: Create systemd Service

```bash
cat > /etc/systemd/system/datasport-crawler.service << 'EOF'
[Unit]
Description=Datasport Crawler
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/datasport-crawler
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

### Step 6: Start Service

```bash
# Reload systemd
systemctl daemon-reload

# Enable auto-start
systemctl enable datasport-crawler

# Start
systemctl start datasport-crawler

# Check status
systemctl status datasport-crawler

# View logs
journalctl -u datasport-crawler -f
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development mode |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled code |
| `systemctl status datasport-crawler` | Check service status |
| `systemctl restart datasport-crawler` | Restart service |
| `journalctl -u datasport-crawler -f` | View logs |

## How It Works

1. **Fetches** the registration page every 5 seconds
2. **Parses** HTML to find the status text
3. **Compares** with previous state
4. **Notifies** instantly when status changes
5. **Saves** state to file for persistence

## Block Detection

The crawler detects potential blocks by monitoring:
- HTTP error codes (429, 403, etc.)
- Slow responses (>10 seconds)
- Multiple consecutive failures

If blocked, you'll get a Telegram warning and the service will backoff.

## License

MIT — use at your own risk for personal monitoring only.
