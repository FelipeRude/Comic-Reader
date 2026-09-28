#!/bin/bash
# Build + FTPS-Upload von dist/ → comic-reader.felipe-rude.de
#
# Verwendung:
#   ./scripts/deploy.sh live         # Live-Seite
#   ./scripts/deploy.sh dev          # develop.comic-reader.felipe-rude.de
#   ./scripts/deploy.sh live --dry   # nur anzeigen, was hochgeladen/gelöscht würde
#
# Zugangsdaten liegen in .env.deploy (gitignored), siehe .env.deploy.example

set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="${1:-}"
DRY=""
[ "${2:-}" = "--dry" ] && DRY="--dry-run"

if [ ! -f .env.deploy ]; then
  echo "Fehler: .env.deploy fehlt (Vorlage: .env.deploy.example)."
  exit 1
fi
source .env.deploy

case "$TARGET" in
  live) HOST="$LIVE_HOST"; FTP_USER="$LIVE_USER"; PASS="$LIVE_PASS" ;;
  dev)  HOST="$DEV_HOST";  FTP_USER="$DEV_USER";  PASS="$DEV_PASS" ;;
  *)    echo "Verwendung: $0 live|dev [--dry]"; exit 1 ;;
esac

command -v lftp >/dev/null || { echo "Fehler: lftp fehlt (brew install lftp)."; exit 1; }

echo "▶ Build ..."
rm -rf dist
DEPLOY_TARGET="$TARGET" npm run build --silent 2>&1 | grep -v -i "deprecat\|legacy-js-api\|sass-lang\|More info" || true
[ -f dist/index.html ] || { echo "Fehler: Build fehlgeschlagen."; exit 1; }

echo "▶ Upload dist/ → $HOST ${DRY:+(Dry-Run)} ..."
# Passwort über Umgebungsvariable, damit es nicht in der Prozessliste steht.
# 'cls /' erzwingt einen echten Login – auch beim Dry-Run (sonst bricht lftp nicht ab).
export LFTP_PASSWORD="$PASS"
lftp -c "
set ftp:ssl-force true;
set ftp:ssl-protect-data true;
set ssl:verify-certificate no;
set net:max-retries 2;
set cmd:fail-exit true;
open --env-password -u '$FTP_USER' ftp://$HOST:21;
cls / > /dev/null;
mirror --reverse --delete --verbose --exclude-glob .DS_Store $DRY dist/ /;
bye
"

echo "✔ Fertig: https://$HOST"
