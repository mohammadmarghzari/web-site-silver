#!/usr/bin/env bash
# Encodes a PNG sequence (from capture-frames.mjs) into a transparent MOV
# (ProRes 4444) and a transparent WebM (VP9), both with a real alpha
# channel. Requires ffmpeg with prores_ks and libvpx-vp9 (any recent
# ffmpeg build has both).
#
# Usage:
#   export/render-alpha.sh <frames_dir> <fps> <output_basename>
#
# Example:
#   node export/capture-frames.mjs --alpha --fps 60
#   export/render-alpha.sh export/frames/9x16-alpha 60 out/intro-9x16-alpha
#
# Produces:
#   out/intro-9x16-alpha.mov   (ProRes 4444 + alpha — Premiere/FCP/Resolve/AE)
#   out/intro-9x16-alpha.webm (VP9 + alpha — web/browser use)
set -euo pipefail

FRAMES_DIR="${1:?Usage: render-alpha.sh <frames_dir> <fps> <output_basename>}"
FPS="${2:?Usage: render-alpha.sh <frames_dir> <fps> <output_basename>}"
OUT="${3:?Usage: render-alpha.sh <frames_dir> <fps> <output_basename>}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found on PATH. Install it (e.g. 'apt install ffmpeg' / 'brew install ffmpeg')." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"

# Figure out the zero-padding / glob pattern capture-frames.mjs used.
FIRST_FRAME="$(ls "$FRAMES_DIR"/frame_*.png | sort | head -n1)"
PAD_LEN=$(basename "$FIRST_FRAME" | sed -E 's/frame_([0-9]+)\.png/\1/' | wc -c)
PAD_LEN=$((PAD_LEN - 1))
PATTERN="$FRAMES_DIR/frame_%0${PAD_LEN}d.png"

echo "==> ProRes 4444 MOV (alpha) -> ${OUT}.mov"
ffmpeg -y -framerate "$FPS" -i "$PATTERN" \
  -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le -alpha_bits 16 \
  -vendor apl0 \
  "${OUT}.mov"

echo "==> VP9 WebM (alpha) -> ${OUT}.webm"
ffmpeg -y -framerate "$FPS" -i "$PATTERN" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 18 \
  "${OUT}.webm"

echo ""
echo "Done:"
echo "  ${OUT}.mov   (import into Premiere/FCP/DaVinci/After Effects — alpha preserved)"
echo "  ${OUT}.webm  (for web players / browser-based editors that support alpha WebM)"
