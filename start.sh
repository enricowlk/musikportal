#!/bin/bash
# 🚀 Musikportal - Deployment Script
# Für Server-Admins: Einfach ausführen!

echo "🎵 Musikportal - Deployment Starting..."
echo ""

# Prüfe Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker ist nicht installiert!"
    echo "   Installiere Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose ist nicht installiert!"
    echo "   Installiere Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker ist verfügbar"

# Stoppe alte Container (falls vorhanden)
echo "🛑 Stoppe alte Container..."
docker-compose down 2>/dev/null || true

# Baue und starte neue Container
echo "🏗️  Baue Container..."
docker-compose up -d --build

# Warte auf Health Check
echo "🏥 Warte auf Health Check..."
sleep 15

# Prüfe ob Container läuft
if docker-compose ps | grep -q "Up"; then
    echo "✅ Container läuft erfolgreich!"
    echo ""
    echo "🌐 Website verfügbar unter:"
    echo "   http://localhost:3000"
    echo ""
    echo "📋 Nützliche Befehle:"
    echo "   docker-compose logs -f    # Live Logs"
    echo "   docker-compose ps         # Container Status"
    echo "   docker-compose down       # Stoppen"
    echo "   docker-compose restart    # Neustart"
    echo ""
else
    echo "❌ Container-Start fehlgeschlagen!"
    echo "📋 Logs:"
    docker-compose logs
    exit 1
fi

echo "🎉 Deployment erfolgreich abgeschlossen!"
