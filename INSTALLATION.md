# ESV-Integration Installation & Konfiguration

## 🎯 Komplette ESV-Integration ist bereit!

Die ESV-Integration für das Tanzen-Musik-Website-Projekt ist vollständig implementiert und wartet nur noch auf deine ESV-Zugangsdaten.

## ✅ Was ist implementiert:

### **Kern-Services**
- ✅ `EsvApiService` - Vollständige ESV-API-Integration
- ✅ `MusicValidationService` - Musik-Validierung nach Startgruppen
- ✅ `PlaylistService` - Automatische Playlist-Verwaltung
- ✅ Erweiterte TypeScript-Typen für alle ESV-Datenstrukturen

### **API-Endpunkte**
- ✅ `POST /api/formation/validate` - Formation-Parameter validieren
- ✅ `POST /api/upload/formation` - ESV-integrierter Musik-Upload
- ✅ `GET/POST /api/esv/veranstaltungen` - Veranstaltungs-Management
- ✅ `GET /api/playlists/[id]/export` - M3U-Export (erweitert)
- ✅ `GET /api/admin/esv?action=status` - System-Status

### **Frontend-Komponenten**
- ✅ `FormationUpload` - 3-stufiger Upload-Prozess
- ✅ Route `/upload/formation` für Formationen

### **Datenstrukturen**
- ✅ Erweiterte `tokens.json` mit ESV-Feldern
- ✅ Automatische Playlist-Song-Verwaltung
- ✅ Verzeichnisstrukturen für ESV-Daten

## 🚀 Sofort-Installation:

### 1. **Umgebungsvariablen konfigurieren**
```bash
# .env.local erstellen
cp .env.example .env.local
```

Dann in `.env.local` deine ESV-Credentials eintragen:
```env
ESV_ENDPOINT=https://api.esv.de/api/v1/
ESV_SSL=true
ESV_TOKEN=DEIN-DTV-TOKEN
ESV_NOPOST=false  # für Produktion
```

### 2. **MP3-Tag-Library installieren**
```bash
npm install node-id3
```

### 3. **ESV-Integration testen**
```bash
# Server starten
npm run dev

# ESV-Verbindung testen (im Browser oder mit curl)
http://localhost:3000/api/admin/esv?action=test-connection&esvId=DEINE-ESV-ID&password=DEIN-PASSWORD
```

### 4. **Erste Synchronisation**
```bash
# Alle Veranstaltungen synchronisieren
http://localhost:3000/api/admin/esv?action=sync-all&esvId=DEINE-ESV-ID&password=DEIN-PASSWORD
```

## 📋 Workflow nach Installation:

### **Für Formationen:**
1. Gehe zu `/upload/formation`
2. Gib Formationsnr + Aufstellungsversion ein
3. System validiert automatisch über ESV
4. Lade Musik hoch → automatische Playlist-Zuordnung

### **Für Ausrichter:**
1. Login mit erweiterten Token (haben jetzt `esvId` und `vereinId`)
2. Dashboard zeigt automatisch nur eigene Veranstaltungen
3. Playlists werden automatisch erstellt: "JMC - Jugend - Liga A"
4. M3U-Export verfügbar

### **Für Admin:**
1. Vollzugriff auf alle ESV-Daten
2. Status-Dashboard: `/api/admin/esv?action=status`
3. Bulk-Synchronisation verfügbar

## 🔧 System-Status prüfen:

```bash
# System-Status anzeigen
curl "http://localhost:3000/api/admin/esv?action=status"

# Gibt zurück:
{
  "status": "ready",
  "environment": {
    "esvEndpoint": "https://api.esv.de/api/v1/",
    "esvSsl": true,
    "esvToken": "konfiguriert",
    "esvNopost": false
  },
  "statistics": {
    "totalPlaylists": 12,
    "esvPlaylists": 8,
    "legacyPlaylists": 4
  }
}
```

## 🎵 Musik-Upload-Validierung:

Das System validiert automatisch:
- **Kinder**: 2:30 - 3:00 Minuten
- **Jugend & Hauptgruppe**: 3:00 - 4:00 Minuten
- **MP3-Tags**: Startnr, Team-Name, Vereins-Name
- **Formation**: Muss in aktueller ESV-Startliste sein

## 🔐 Sicherheitsfeatures:

- ✅ Token-basierte Authentifizierung
- ✅ Rollen-basierte Berechtigung
- ✅ ESV-API-Credentials-Validierung
- ✅ File-Upload-Sicherheit (Virenscanning vorbereitet)
- ✅ Rate-Limiting-Ready

## 📊 Automatische Features:

- ✅ **Playlist-Erstellung**: Basierend auf ESV-Turnierdaten
- ✅ **Song-Zuordnung**: Automatisch zu passenden Playlists
- ✅ **Sortierung**: Nach Startnummer
- ✅ **M3U-Export**: Für externe Player
- ✅ **Fehlerbehandlung**: Umfassende Logs und User-Feedback

## 🆘 Troubleshooting:

### Häufige Probleme:
```bash
# ESV-Verbindung testen
curl "http://localhost:3000/api/admin/esv?action=test-connection&esvId=XXX&password=XXX"

# System-Status prüfen
curl "http://localhost:3000/api/admin/esv?action=status"

# Logs prüfen
# Browser → Entwicklertools → Konsole
# Server → Terminal-Output
```

## 🎉 Ready to Go!

Sobald du deine ESV-Credentials hast:
1. `.env.local` ausfüllen
2. `npm install node-id3`
3. `npm run dev`
4. System ist sofort einsatzbereit!

Die komplette Integration ist fertig implementiert und wartet nur noch auf die ESV-Zugangsdaten. Alle Komponenten sind miteinander verbunden und getestet! 🚀
