@echo off
REM 🚀 Musikportal - Windows Deployment Script
REM Für Server-Admins: Einfach ausführen!

echo 🎵 Musikportal - Deployment Starting...
echo.

REM Prüfe Docker
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker ist nicht installiert!
    echo    Installiere Docker Desktop: https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker Compose ist nicht installiert!
    echo    Docker Compose ist normalerweise in Docker Desktop enthalten
    pause
    exit /b 1
)

echo ✅ Docker ist verfügbar

REM Stoppe alte Container
echo 🛑 Stoppe alte Container...
docker-compose down 2>nul

REM Baue und starte neue Container
echo 🏗️  Baue Container...
docker-compose up -d --build

REM Warte auf Health Check
echo 🏥 Warte auf Health Check...
timeout 15 >nul

REM Prüfe Container Status
docker-compose ps | findstr "Up" >nul
if %ERRORLEVEL% equ 0 (
    echo ✅ Container läuft erfolgreich!
    echo.
    echo 🌐 Website verfügbar unter:
    echo    http://localhost:3000
    echo.
    echo 📋 Nützliche Befehle:
    echo    docker-compose logs -f    # Live Logs
    echo    docker-compose ps         # Container Status
    echo    docker-compose down       # Stoppen
    echo    docker-compose restart    # Neustart
    echo.
) else (
    echo ❌ Container-Start fehlgeschlagen!
    echo 📋 Logs:
    docker-compose logs
    pause
    exit /b 1
)

echo 🎉 Deployment erfolgreich abgeschlossen!
pause
