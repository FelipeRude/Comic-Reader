#!/bin/bash
# FTP Upload → develop.comic-reader.felipe-rude.de
# Verwendung: ./deploy_dev.sh [lokales-verzeichnis]
# Standard-Upload-Verzeichnis: dist/ (kann als Argument überschrieben werden)

LOCAL_DIR="${1:-dist}"

if [ ! -d "$LOCAL_DIR" ]; then
  echo "Fehler: Verzeichnis '$LOCAL_DIR' nicht gefunden."
  exit 1
fi

echo "Uploade '$LOCAL_DIR' → develop.comic-reader.felipe-rude.de ..."

lftp -c "
set ftp:ssl-force true;
set ftp:ssl-protect-data true;
set ssl:verify-certificate no;
open -u clyo_dev_comic-reader,poztud-2nomty-hygdYm ftp://develop.comic-reader.felipe-rude.de:21;
mirror --reverse --delete --verbose \
  $LOCAL_DIR/ \
  /;
bye
"

echo "Fertig!"
