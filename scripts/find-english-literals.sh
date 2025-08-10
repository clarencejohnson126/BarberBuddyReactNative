#!/usr/bin/env bash

# Quick grep to spot likely hardcoded English strings in TS/TSX files
# Excludes locale JSONs and node_modules

ripgrep -n --hidden --glob '!node_modules/**' --glob '!assets/locales/**' \
  --glob '!**/*.json' \
  --iglob '*.ts' --iglob '*.tsx' \
  '"[A-Za-z][A-Za-z0-9 ,.!?\-\(\)\']{3,}"' \
  src || true

printf "\nTODO: Replace found literals with t('...') and add keys to assets/locales/*.json\n"
