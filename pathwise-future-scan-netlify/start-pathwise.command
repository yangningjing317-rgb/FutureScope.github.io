#!/bin/zsh
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then
  node server.js
elif [ -x "/Applications/Codex.app/Contents/Resources/node" ]; then
  "/Applications/Codex.app/Contents/Resources/node" server.js
else
  echo "Node.js was not found. Please install Node.js 18 or newer, then run this file again."
  read -k 1 "?Press any key to close..."
fi
