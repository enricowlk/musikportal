# 🎵 Tanzen Musik Website - Docker Setup

## 🚀 Sofort deploybar!

Dieses Projekt ist vollständig containerisiert und **ready-to-deploy**.

### One-Command Deployment:

```bash
docker-compose up -d
```

Das war's! 🎉

## 📋 Was passiert automatisch:

- ✅ **Container wird gebaut** (Multi-stage optimiert)
- ✅ **App startet auf Port 3000**
- ✅ **Persistente Daten** werden gespeichert
- ✅ **Health Checks** überwachen die App
- ✅ **Auto-Restart** bei Fehlern
- ✅ **Traefik Labels** für Reverse Proxy (optional)

## 🔧 Server-Admin Infos:

### Ports:
- **App**: `3000` (HTTP)

### Volumes (automatisch erstellt):
- `./data/` → Playlists, Turniere (JSON)
- `./uploads/` → Musikdateien  
- `./temp/` → Temporäre Upload-Dateien

### Health Check:
- **URL**: `http://localhost:3000/api/health`
- **Interval**: 30s
- **Timeout**: 10s

### Environment Variables (optional):
```bash
# .env Datei erstellen für Custom Settings
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here
```

## 🌐 Integration mit Reverse Proxy:

### Nginx:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Traefik (Labels sind bereits im docker-compose.yml):
```bash
# Einfach Domain in den Labels ändern:
- "traefik.http.routers.tanzen-musik.rule=Host(`deine-domain.com`)"
```

### Caddy:
```caddy
deine-domain.com {
    reverse_proxy localhost:3000
}
```

## 📊 Monitoring & Logs:

```bash
# Container Status
docker-compose ps

# Live Logs
docker-compose logs -f

# Health Check
curl http://localhost:3000/api/health
```

## 🛠️ Wartung:

```bash
# Update (bei Code-Änderungen)
docker-compose down
docker-compose up -d --build

# Backup der Daten
tar -czf backup-$(date +%Y%m%d).tar.gz data/ uploads/

# Container neustarten
docker-compose restart

# Logs bereinigen
docker system prune -f
```

## 🔒 Sicherheit:

- ✅ **Non-root User** im Container
- ✅ **Multi-stage Build** (minimale Image-Größe)
- ✅ **Health Checks** integriert
- ✅ **Restart Policy** gesetzt
- ✅ **File Upload Limits** konfiguriert

## 🎯 Für Server-Admins:

**Das Projekt ist "deployment-ready":**

1. Repository klonen
2. `docker-compose up -d`
3. Reverse Proxy auf Port 3000 zeigen lassen
4. Fertig! 🎉

**Keine weiteren Konfigurationen nötig!**
