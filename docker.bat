@echo off
REM Docker Management Script für Windows PowerShell
REM Musikportal

setlocal EnableDelayedExpansion

REM Farben für PowerShell (falls unterstützt)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

if "%1"=="" goto :help
if "%1"=="help" goto :help
if "%1"=="build" goto :build
if "%1"=="start" goto :start
if "%1"=="stop" goto :stop
if "%1"=="restart" goto :restart
if "%1"=="logs" goto :logs
if "%1"=="status" goto :status
if "%1"=="clean" goto :clean
if "%1"=="shell" goto :shell
goto :help

:help
echo Docker Management für Musikportal Website
echo.
echo Verwendung: %0 [COMMAND]
echo.
echo Commands:
echo   build     - Docker Image bauen
echo   start     - Container starten
echo   stop      - Container stoppen
echo   restart   - Container neustarten
echo   logs      - Container Logs anzeigen
echo   status    - Container Status anzeigen
echo   clean     - Alle Docker Ressourcen löschen
echo   shell     - Shell im Container öffnen
echo   help      - Diese Hilfe anzeigen
echo.
goto :end

:build
echo %BLUE%[INFO]%NC% Baue Docker Image...
docker build -t Musikportal .
if %ERRORLEVEL% equ 0 (
    echo %GREEN%[SUCCESS]%NC% Docker Image erfolgreich gebaut!
) else (
    echo %RED%[ERROR]%NC% Fehler beim Bauen des Docker Images!
    exit /b 1
)
goto :end

:start
echo %BLUE%[INFO]%NC% Starte Container...
docker-compose up -d
if %ERRORLEVEL% equ 0 (
    echo %GREEN%[SUCCESS]%NC% Container gestartet! Verfügbar unter http://localhost:3000
) else (
    echo %RED%[ERROR]%NC% Fehler beim Starten des Containers!
    exit /b 1
)
goto :end

:stop
echo %BLUE%[INFO]%NC% Stoppe Container...
docker-compose down
if %ERRORLEVEL% equ 0 (
    echo %GREEN%[SUCCESS]%NC% Container gestoppt!
) else (
    echo %RED%[ERROR]%NC% Fehler beim Stoppen des Containers!
    exit /b 1
)
goto :end

:restart
echo %BLUE%[INFO]%NC% Starte Container neu...
docker-compose restart
if %ERRORLEVEL% equ 0 (
    echo %GREEN%[SUCCESS]%NC% Container neugestartet!
) else (
    echo %RED%[ERROR]%NC% Fehler beim Neustarten des Containers!
    exit /b 1
)
goto :end

:logs
echo %BLUE%[INFO]%NC% Zeige Container Logs...
docker-compose logs -f
goto :end

:status
echo %BLUE%[INFO]%NC% Container Status:
docker-compose ps
goto :end

:clean
echo %YELLOW%[WARNING]%NC% Lösche alle Docker Ressourcen...
docker-compose down
docker rmi tanzen-musik-website 2>nul || echo Image nicht gefunden
docker system prune -f
echo %GREEN%[SUCCESS]%NC% Aufräumen abgeschlossen!
goto :end

:shell
echo %BLUE%[INFO]%NC% Öffne Shell im Container...
docker-compose exec app sh
goto :end

:end
endlocal
