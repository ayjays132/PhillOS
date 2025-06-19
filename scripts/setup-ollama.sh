#!/usr/bin/env bash
set -e

MODEL="${1:-qwen3:1.7b}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama not found. Install it from https://ollama.com/download and ensure 'ollama' is in your PATH." >&2
  exit 1
fi

if ! ollama list | grep -q "^$MODEL"; then
  echo "Downloading model $MODEL..."
  ollama pull "$MODEL"
fi

if ! pgrep -f "ollama serve" >/dev/null; then
  echo "Starting Ollama server..."
  nohup ollama serve >/tmp/ollama.log 2>&1 &
  echo "Ollama server started in the background. Logs: /tmp/ollama.log"
else
  echo "Ollama server already running."
fi
