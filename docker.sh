#!/bin/bash
# Docker Management Script für Musikportal Website

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Hilfe anzeigen
show_help() {
    echo "Docker Management für Musikportal Website"
    echo ""
    echo "Verwendung: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     - Docker Image bauen"
    echo "  start     - Container starten"
    echo "  stop      - Container stoppen"
    echo "  restart   - Container neustarten"
    echo "  logs      - Container Logs anzeigen"
    echo "  status    - Container Status anzeigen"
    echo "  clean     - Alle Docker Ressourcen löschen"
    echo "  shell     - Shell im Container öffnen"
    echo "  help      - Diese Hilfe anzeigen"
    echo ""
}

# Docker Image bauen
build_image() {
    log_info "Baue Docker Image..."
    docker build -t Musikportal .
    log_success "Docker Image erfolgreich gebaut!"
}

# Container starten
start_container() {
    log_info "Starte Container..."
    docker-compose up -d
    log_success "Container gestartet! Verfügbar unter http://localhost:3000"
}

# Container stoppen
stop_container() {
    log_info "Stoppe Container..."
    docker-compose down
    log_success "Container gestoppt!"
}

# Container neustarten
restart_container() {
    log_info "Starte Container neu..."
    docker-compose restart
    log_success "Container neugestartet!"
}

# Logs anzeigen
show_logs() {
    log_info "Zeige Container Logs..."
    docker-compose logs -f
}

# Status anzeigen
show_status() {
    log_info "Container Status:"
    docker-compose ps
}

# Aufräumen
clean_all() {
    log_warning "Lösche alle Docker Ressourcen..."
    docker-compose down
    docker rmi Musikportal 2>/dev/null || true
    docker system prune -f
    log_success "Aufräumen abgeschlossen!"
}

# Shell im Container
open_shell() {
    log_info "Öffne Shell im Container..."
    docker-compose exec app sh
}

# Hauptlogik
case "${1:-help}" in
    build)
        build_image
        ;;
    start)
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    clean)
        clean_all
        ;;
    shell)
        open_shell
        ;;
    help|*)
        show_help
        ;;
esac
