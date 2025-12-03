#!/usr/bin/env bash
set -euo pipefail

# fix-template-path.sh
# Usage:
#   chmod +x fix-template-path.sh
#   ./fix-template-path.sh [TEMPLATE_SOURCE]
#
# If TEMPLATE_SOURCE is omitted the script will try these defaults (in order):
#   ./guru-able-auth
#   ../guru-able-template
#   ./guru-able-template
#   ../guru-able-auth

err() { echo "ERROR: $*" >&2; exit 1; }

PROJECT_ROOT="$(pwd)"
SRC_INDEX="$PROJECT_ROOT/src/index.html"
if [ ! -f "$PROJECT_ROOT/package.json" ] || [ ! -d "$PROJECT_ROOT/src" ]; then
  err "This doesn't look like an Angular project root. Run this from the project root (contains package.json and src/)."
fi

# Candidate locations (do NOT reference $1 here to avoid nounset issues)
CANDIDATES=( "./guru-able-auth" "../guru-able-template" "./guru-able-template" "../guru-able-auth" )

# Determine source directory
SRC_DIR=""
if [ "${1:-}" != "" ]; then
  if [ -d "${1:-}" ]; then
    SRC_DIR="${1:-}"
  else
    err "Provided template source does not exist: ${1:-}"
  fi
else
  for p in "${CANDIDATES[@]}"; do
    if [ -d "$p" ]; then
      SRC_DIR="$p"
      break
    fi
  done
fi

if [ -z "$SRC_DIR" ]; then
  echo "Could not find a template source in the usual locations."
  echo "Please pass the path to your Guru Able template folder:"
  echo "  ./fix-template-path.sh /path/to/guru-able-template"
  echo
  echo "Searched locations:"
  for p in "${CANDIDATES[@]}"; do echo "  $p"; done
  exit 2
fi

echo "Using template source: $SRC_DIR"

ASSETS_DIR="$PROJECT_ROOT/src/assets/guruable"
mkdir -p "$ASSETS_DIR/css" "$ASSETS_DIR/js" "$ASSETS_DIR/images" "$ASSETS_DIR/fonts"

echo "Copying CSS files (if present)..."
for f in "css/vendors.bundle.css" "css/style.css"; do
  if [ -f "$SRC_DIR/$f" ]; then
    cp -v "$SRC_DIR/$f" "$ASSETS_DIR/css/"
  else
    echo "  (not found) $SRC_DIR/$f"
  fi
done

echo "Copying JS files (if present)..."
for f in "js/vendors.bundle.js" "js/main.js"; do
  if [ -f "$SRC_DIR/$f" ]; then
    cp -v "$SRC_DIR/$f" "$ASSETS_DIR/js/"
  else
    echo "  (not found) $SRC_DIR/$f"
  fi
done

if [ -d "$SRC_DIR/images" ]; then
  echo "Copying images..."
  cp -rv "$SRC_DIR/images" "$ASSETS_DIR/" || true
fi
if [ -d "$SRC_DIR/fonts" ]; then
  echo "Copying fonts..."
  cp -rv "$SRC_DIR/fonts" "$ASSETS_DIR/" || true
fi

if [ ! -f "$SRC_INDEX" ]; then
  err "src/index.html not found. Are you in the Angular project root?"
fi

insert_before_tag() {
  local tag="$1"; local line="$2"; local file="$3"
  if ! grep -Fq "$line" "$file"; then
    awk -v tag="$tag" -v newline="$line" '
      BEGIN { inserted=0 }
      {
        if (!inserted && tolower($0) ~ tolower(tag)) {
          print newline
          inserted=1
        }
        print $0
      }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    echo "Inserted into $file: $line"
  else
    echo "Index already contains: $line"
  fi
}

CSS_VENDOR_LINE='<link rel="stylesheet" href="assets/guruable/css/vendors.bundle.css" />'
CSS_STYLE_LINE='<link rel="stylesheet" href="assets/guruable/css/style.css" />'
JS_VENDOR_LINE='<script src="assets/guruable/js/vendors.bundle.js"></script>'
JS_MAIN_LINE='<script src="assets/guruable/js/main.js"></script>'

insert_before_tag "</head>" "$CSS_VENDOR_LINE" "$SRC_INDEX"
insert_before_tag "</head>" "$CSS_STYLE_LINE" "$SRC_INDEX"
insert_before_tag "</body>" "$JS_VENDOR_LINE" "$SRC_INDEX"
insert_before_tag "</body>" "$JS_MAIN_LINE" "$SRC_INDEX"

ANGULAR_JSON="$PROJECT_ROOT/angular.json"
if [ -f "$ANGULAR_JSON" ]; then
  if command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1; then
    PY=$(command -v python3 2>/dev/null || command -v python)
    cp -v "$ANGULAR_JSON" "${ANGULAR_JSON}.bak.$(date +%s)"
    "$PY" - <<PYCODE
import json,sys
p = "$ANGULAR_JSON"
with open(p,'r',encoding='utf-8') as f:
    data = json.load(f)
proj = data.get('defaultProject') or next(iter(data.get('projects',{})), None)
if not proj:
    print('No project found in angular.json; skipping automated update.')
    sys.exit(0)
projcfg = data['projects'][proj]
opts = projcfg.get('architect',{}).get('build',{}).get('options',{})
styles = opts.get('styles',[])
entries = ["src/assets/guruable/css/vendors.bundle.css","src/assets/guruable/css/style.css"]
for e in entries:
    if e not in styles:
        styles.insert(0,e)
opts['styles']=styles
projcfg['architect']['build']['options']=opts
data['projects'][proj]=projcfg
with open(p,'w',encoding='utf-8') as f:
    json.dump(data,f,indent=2)
print('angular.json updated (added guru-able styles if not present).')
PYCODE
  else
    echo "Python not available, skipping automatic angular.json edit."
    echo "To add the styles manually, edit angular.json and add under build.options.styles:"
    echo '  "src/assets/guruable/css/vendors.bundle.css",'
    echo '  "src/assets/guruable/css/style.css",'
  fi
else
  echo "angular.json not found in project root; skipping angular.json update."
fi

echo
echo "DONE. Restart ng serve if it is running:"
echo "  npx ng serve --open"
echo
echo "If files 404, ensure the source template actually contained them or pass the correct path:"
echo "  ./fix-template-path.sh /path/to/your/template"
