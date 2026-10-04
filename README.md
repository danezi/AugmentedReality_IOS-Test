# AugmentedReality_IOS-Test

Ein kleines **WebXR-AR-Testprojekt**: Ein 3D-Modell ("Neuer Hafen", Bremen/Bremerhaven) wird im Browser mit [Three.js](https://threejs.org/) geladen und kann per Augmented Reality im Raum platziert werden.

## Funktionsweise

- **Android / WebXR-fähige Browser:** Nutzt `ARButton` (Three.js WebXR) mit Hit-Test, um das GLB-Modell (`3DModel/neuerHafen.glb`) in der realen Umgebung zu platzieren.
- **iOS:** Da iOS Safari kein WebXR unterstützt, erkennt die Seite iOS-Geräte automatisch und zeigt stattdessen einen Fallback-Button an, der das Modell als USDZ-Datei (`3DModel/neuerHafen.usdz`) über **AR Quick Look** öffnet.
- Auf dem Desktop wird das Modell als normale 3D-Vorschau mit automatischer Rotation gerendert; ein Klick auf Teile des Modells zeigt Infos in einer kleinen Overlay-Box.

## Tech-Stack

- Three.js (via `importmap`, geladen über unpkg CDN)
- WebXR Device API (`ARButton`, `hit-test`)
- USDZ + AR Quick Look für iOS
- Express (für einen simplen lokalen Dev-Server)

## Lokal starten

```bash
npm install
npx http-server .   # oder: node server.js, je nach Setup
```

Die Seite anschließend über HTTPS (für WebXR-Kamerazugriff erforderlich) auf einem AR-fähigen Gerät öffnen.

## Hinweis

Testprojekt zum Experimentieren mit WebXR/AR-Quick-Look-Integration — nicht produktionsreif.
