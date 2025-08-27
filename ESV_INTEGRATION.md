# ESV-Integration - Setup und Verwendung

## Übersicht

Diese ESV-Integration ermöglicht die automatische Synchronisation von Turnierdaten mit dem Deutschen Tanzsport Verband (DTV) und die automatische Erstellung von Playlists basierend auf ESV-API-Daten.

## Implementierte Funktionen

### Für Formationen (Upload-Bereich):
- ✅ Validierung von Formationsnummer und Aufstellungsversion über ESV-API
- ✅ Automatische Startgruppen-Erkennung aus ESV-Turnierdaten
- ✅ Musik-Längenvalidierung je nach Startgruppe:
  - Kinder: 2:30 - 3:00 Minuten
  - Jugend & Hauptgruppe: 3:00 - 4:00 Minuten
- ✅ Automatische MP3-Tag-Bearbeitung (Titel = Startnummer, Album = Teamname, Künstler = Vereinsname)
- ✅ Automatische Zuordnung zu relevanten Playlists

### Für Ausrichter (Dashboard/Playlists):
- ✅ Token-basierter Zugriff mit ESV-Veranstaltungs-ID
- ✅ Filterung nach Ausrichter-Berechtigung
- ✅ Automatische Playlist-Erstellung basierend auf Turnierdaten
- ✅ Playlist-Benennung: "{Turnierart} - {Startgruppe} - {Startklasse/Liga}"
- ✅ M3U-Export für externe Player
- ✅ Automatische Sortierung nach Startnummer

### Für Admin:
- ✅ Vollzugriff auf alle ESV-Daten
- ✅ Synchronisation aller Veranstaltungen
- ✅ Saison-Ende Löschfunktion (vorbereitet)

## Setup-Anweisungen

### 1. Umgebungsvariablen konfigurieren

Kopieren Sie `.env.example` zu `.env.local` und füllen Sie die ESV-Konfiguration aus:

```bash
cp .env.example .env.local
```

Füllen Sie folgende Variablen mit echten Werten:
- `ESV_ENDPOINT`: ESV API Endpoint
- `ESV_TOKEN`: Ihr DTV Token
- `ESV_SSL`: SSL aktivieren (true)
- `ESV_NOPOST`: Auf false setzen für Produktion

### 2. Zusätzliche Dependencies installieren

Für die vollständige Funktionalität müssen noch folgende Pakete installiert werden:

```bash
npm install node-id3
```

Diese Bibliothek wird für die MP3-Tag-Bearbeitung benötigt.

### 3. Datenbankstruktur

Die Integration verwendet JSON-Dateien im `data/`-Verzeichnis:
- `data/playlists.json`: Playlist-Metadaten
- `data/playlist-songs/*.json`: Songs pro Playlist
- `data/tokens.json`: Erweitert um ESV-Felder

### 4. Token-Erweiterung

Erweitern Sie bestehende Tokens um ESV-spezifische Felder:
```json
{
  "id": "token-id",
  "name": "Ausrichter Name",
  "role": "ausrichter",
  "esvId": "esv-benutzer-id",
  "vereinId": "verein-id-in-esv"
}
```

## API-Endpunkte

### ESV-Integration
- `GET /api/esv/veranstaltungen` - Lädt Veranstaltungen für Benutzer
- `POST /api/esv/veranstaltungen` - Synchronisiert ESV-Daten (Admin)
- `POST /api/formation/validate` - Validiert Formation-Parameter
- `POST /api/upload/formation` - Upload mit ESV-Integration

### Playlist-Export
- `GET /api/playlists/[id]/export` - M3U-Export

### Admin-Funktionen
- `GET /api/admin/esv` - ESV-Admin-Dashboard
- `DELETE /api/admin/esv` - Saison-Cleanup

## Verwendung

### Formation-Upload
1. Formationsnummer und Aufstellungsversion eingeben
2. ESV-Zugangsdaten eingeben (temporär - wird später sicher gespeichert)
3. System validiert Formation über ESV-API
4. Musik-Datei hochladen
5. Automatische Validierung und Zuordnung zu Playlists

### Ausrichter-Dashboard
1. Login mit ESV-Token
2. Anzeige nur der eigenen Veranstaltungen
3. Automatisch generierte Playlists pro Turnier
4. M3U-Export für externe Player

### Admin-Bereich
1. Vollzugriff auf alle ESV-Daten
2. Bulk-Synchronisation
3. Überblick über alle Veranstaltungen und Playlists

## Sicherheitshinweise

⚠️ **Wichtig für Produktion:**
1. ESV-Credentials niemals im Frontend speichern
2. Sichere Token-Verwaltung implementieren
3. HTTPS verwenden für alle ESV-API-Calls
4. Rate-Limiting für ESV-API-Requests

## Nächste Schritte

Wenn Sie die ESV-Zugangsdaten erhalten:

1. `.env.local` mit echten Werten füllen
2. `node-id3` installieren für MP3-Tag-Bearbeitung
3. ESV-Verbindung testen: `GET /api/admin/esv?action=test-connection`
4. Erste Synchronisation durchführen: `GET /api/admin/esv?action=sync-all`

## Troubleshooting

### Häufige Probleme:
- **"ESV-Zugangsdaten fehlen"**: Überprüfen Sie die Umgebungsvariablen
- **"Formation nicht gefunden"**: Formation möglicherweise nicht in aktueller Startliste
- **"Musik zu lang/kurz"**: Startgruppe wird automatisch aus ESV-Daten ermittelt
- **"Playlist nicht erstellt"**: Prüfen Sie ob Turnier-Typ "Formation" ist

## Support

Bei Problemen prüfen Sie:
1. Browser-Konsole für Frontend-Fehler
2. Server-Logs für API-Fehler
3. ESV-API-Dokumentation für Änderungen
4. Netzwerk-Connectivity zur ESV-API
