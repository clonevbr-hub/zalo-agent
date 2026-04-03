# Zalo Chatbot Agent - Cấu hình Nginx

## 📋 Cài đặt Nginx

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
```

### macOS
```bash
brew install nginx
brew services start nginx
```

### Windows
- Download từ https://nginx.org
- Hoặc dùng WSL + Linux instructions

---

## 🔧 Cấu hình Nginx (Reverse Proxy)

Tạo file `/etc/nginx/sites-available/zalo-agent`:

```nginx
upstream zalo_agent {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS (nếu có SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Certificates (Lấy từ Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Client body size limit
    client_max_body_size 10M;

    # Reverse proxy configuration
    location / {
        proxy_pass http://zalo_agent;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://zalo_agent;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔐 Cấu hình SSL với Let's Encrypt

```bash
# Cài đặt Certbot
sudo apt install certbot python3-certbot-nginx

# Tạo certificate
sudo certbot certonly --standalone -d your-domain.com

# Tự động update certificate
sudo certbot renew --dry-run
```

---

## 🚀 Kích hoạt Cấu hình

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zalo-agent /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔄 Sử dụng Systemd Unit cho Node.js

Tạo `/etc/systemd/system/zalo-agent.service`:

```ini
[Unit]
Description=Zalo Agent Chatbot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/username/zalo-chatbot-agent
ExecStart=/usr/bin/node zalo-agent-server.js
Restart=on-failure
RestartSec=5s
StandardOutput=append:/var/log/zalo-agent.log
StandardError=append:/var/log/zalo-agent-error.log

# Environment variables
EnvironmentFile=/home/username/zalo-chatbot-agent/.env

[Install]
WantedBy=multi-user.target
```

Khởi chạy:
```bash
sudo systemctl daemon-reload
sudo systemctl start zalo-agent
sudo systemctl enable zalo-agent
sudo systemctl status zalo-agent
```

---

## 📊 Monitoring

```bash
# Xem logs
sudo tail -f /var/log/zalo-agent.log

# Xem stats Nginx
sudo systemctl status nginx
sudo netstat -tulpn | grep nginx
```

---

## 🧪 Test Setup

```bash
# Test từ local
curl http://localhost:3000/health

# Test qua Nginx
curl https://your-domain.com/health

# Test webhook
curl -X POST https://your-domain.com/webhook?token=token \
  -H "Content-Type: application/json" \
  -d '{"events":[{"event_name":"user_send_text","sender":{"id":"123"},"message":{"text":"Hi"}}]}'
```

---

## ⚡ Performance Optimization

### 1. Gzip Compression
Thêm vào nginx config:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### 2. Load Balancing
```nginx
upstream zalo_agent {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

### 3. Rate Limiting
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://zalo_agent;
}
```

---

## 🐛 Troubleshooting

### Nginx không start
```bash
# Check syntax error
sudo nginx -t

# Xem detailed error
sudo journalctl -u nginx -n 50
```

### Proxy không hoạt động
```bash
# Kiểm tra Node.js có chạy
sudo lsof -i :3000

# Kiểm tra socket
sudo netstat -tulpn | grep 3000
```

### SSL certificate issue
```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo ssl-cert-check -c /etc/letsencrypt/live/your-domain.com/fullchain.pem
```

---

## 📝 Cheat Sheet

```bash
# Restart Nginx
sudo systemctl restart nginx

# View Nginx status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View Node.js logs
sudo journalctl -u zalo-agent -f

# Stop service
sudo systemctl stop zalo-agent

# Edit config (dùng nano/vim)
sudo nano /etc/nginx/sites-available/zalo-agent
```

Đây là hướng dẫn để deploy production-ready! 🚀
