# Docker Setup für Tanzen Musik Website

Diese Anleitung beschreibt, wie du die Tanzen Musik Website lokal mit Docker ausführst.

## Voraussetzungen

- Docker Desktop installiert und ausgeführt
- Docker Compose (normalerweise in Docker Desktop enthalten)

## Quick Start

### Docker Compose verwenden (Empfohlen)

```bash
# Container bauen und starten
docker-compose up --build

# Im Hintergrund starten
docker-compose up -d --build
```

### Management Scripts verwenden

#### Für Linux/Mac:
```bash
# Script ausführbar machen
chmod +x docker.sh

# Container bauen und starten
./docker.sh build
./docker.sh start
```

#### Für Windows:
```cmd
# Container bauen und starten
docker.bat build
docker.bat start
```

## Verfügbare Commands

### Mit docker-compose:
- `docker-compose up -d` - Container im Hintergrund starten
- `docker-compose down` - Container stoppen
- `docker-compose logs -f` - Logs in Echtzeit anzeigen
- `docker-compose ps` - Container Status anzeigen

### Mit Management Scripts:
- `build` - Docker Image bauen
- `start` - Container starten
- `stop` - Container stoppen
- `restart` - Container neustarten
- `logs` - Container Logs anzeigen
- `status` - Container Status anzeigen
- `clean` - Alle Docker Ressourcen löschen
- `shell` - Shell im Container öffnen

## Zugriff auf die Anwendung

Nach dem Start ist die Anwendung verfügbar unter:
- **http://localhost:3000**

## Datenpersistierung

Die folgenden Verzeichnisse werden persistent gespeichert:
- `./public/uploads` - Hochgeladene Musikdateien
- `./data` - JSON-Datenbanken (playlists.json, turniere.json, etc.)
- `./temp` - Temporäre Dateien

## Docker Image Details

- **Base Image**: node:22-alpine
- **Multi-stage Build**: Ja (für optimierte Größe)
- **Production Ready**: Ja
- **Non-root User**: nextjs (UID 1001)
- **Port**: 3000

## Troubleshooting

### Container startet nicht
```bash
# Logs überprüfen
docker-compose logs app

# Container Status prüfen
docker-compose ps
```

### Berechtigungsprobleme mit Uploads
```bash
# In Container-Shell gehen
docker-compose exec app sh

# Berechtigungen prüfen
ls -la /app/public/uploads
```

### Port bereits belegt
Ändere den Port in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Ändere 3000 zu einem freien Port
```

### Image neu bauen nach Code-Änderungen
```bash
# Stoppen und neu bauen
docker-compose down
docker-compose up --build
```

## Entwicklung mit Docker

Für die Entwicklung kannst du auch ein Development Setup verwenden:

```yaml
# docker-compose.dev.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```
