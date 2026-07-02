# Flite updater validation

Flite uses Tauri updater artifacts.

Current endpoint:
https://github.com/Vectair/FDMS/releases/latest/download/latest.json

The public signing key is committed in src-tauri/tauri.conf.json.

The private signing key must never be committed.

Release/update builds require:
- TAURI_SIGNING_PRIVATE_KEY
- TAURI_SIGNING_PRIVATE_KEY_PASSWORD

For pre-V1 updater testing, use monotonically increasing 0.x versions, for example:
- installed test build: 0.9.0
- available update build: 0.9.1

Do not use 1.0.0 until the launch decision.

Validation path:
1. Install signed older build.
2. Publish signed newer GitHub Release containing latest.json and platform update artifacts.
3. Open older installed Flite.
4. Use Admin → Overview → Version & Updates → Check for updates.
5. Confirm newer version is detected.
6. Install update.
7. Restart Flite.
8. Confirm current version changed.
9. Confirm local data survived:
   - movements
   - VKB overrides
   - audit log
   - bookings/calendar
   - settings

## Validated: 0.9.0 → 0.9.1 (Windows NSIS)

The above path was validated end to end on Windows with installed test build
0.9.0 and available update build 0.9.1. Result: pass. Current version updated
to 0.9.1 after install, and local data (movements, VKB overrides, audit log,
bookings/calendar, settings) survived the update.

### Windows install UX note

On Windows NSIS, clicking **Download and install update** (Admin → Overview →
Version & Updates) may close Flite and relaunch it automatically as part of
installation, rather than leaving the app open with a manual **Restart
Flite** button to click. This matches Tauri's documented behaviour: on
Windows, the app is automatically exited before installing an update because
of Windows installer (NSIS) limitations — Flite cannot hold a lock on its own
running executable while the installer replaces it.

The manual **Restart Flite** button remains in the UI as a fallback for
platforms/paths where the app stays open after install and needs an explicit
restart to pick up the new version (step 7 above). Do not treat the absence
of that manual restart step as a failure on Windows — an automatic
close-and-relaunch is the expected outcome there.
