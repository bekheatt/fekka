#!/usr/bin/env bash
# Builds website/ and publishes it to the public repo that GitHub Pages serves at fakkaeg.com.
# Only the website files go there, signed as "Fakka <support@fakkaeg.com>" (no app code, no personal emails).
#   bash scripts/publish-website.sh "What changed"
set -euo pipefail
REPO="https://github.com/bekheatt/fakka-website.git"
MSG="${1:-Update website}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

node "$HERE/scripts/build-website.mts" 2>/dev/null
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Start from what is published now (if anything), then replace it with the fresh build
if git clone --quiet --depth 1 "$REPO" "$TMP/site" 2>/dev/null && [ -d "$TMP/site/.git" ]; then :; else mkdir -p "$TMP/site" && git -C "$TMP/site" init --quiet -b main; fi
find "$TMP/site" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$HERE/website/." "$TMP/site/"

cd "$TMP/site"
git add -A
if git diff --cached --quiet; then echo "Website already up to date."; exit 0; fi
git -c user.name="Fakka" -c user.email="support@fakkaeg.com" commit --quiet -m "$MSG"
git push --quiet "$REPO" HEAD:main
echo "Published to $REPO (live at https://fakkaeg.com in a minute or two)."
