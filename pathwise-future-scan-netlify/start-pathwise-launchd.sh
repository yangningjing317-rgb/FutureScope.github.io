#!/bin/zsh
cd "/Users/yangningjing/Documents/Codex/2026-04-26/ai-future-career-planning-advisor-output" || exit 1
echo "[$(date)] Starting Pathwise server..."
exec "/Applications/Codex.app/Contents/Resources/node" server.js
