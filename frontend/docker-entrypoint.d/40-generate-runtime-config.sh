#!/bin/sh
set -eu

: "${API_URL:?API_URL deve contenere l'URL pubblico dell'API, inclusivo di /api}"

printf 'window.__env = { apiUrl: "%s" };\n' "$API_URL" > /usr/share/nginx/html/assets/runtime-config.js
