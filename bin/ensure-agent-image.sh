#!/usr/bin/env bash
# Pre-start check: rebuild the nanoclaw-agent Docker image if it's missing.
# Runs as ExecStartPre in the systemd service.
set -e

IMAGE="nanoclaw-agent:latest"

if docker image inspect "$IMAGE" > /dev/null 2>&1; then
  echo "[$IMAGE] Image found, skipping build."
  exit 0
fi

echo "[$IMAGE] Image not found — building now. This may take a few minutes..."
cd /opt/nanoclaw/container
CONTAINER_RUNTIME=docker ./build.sh
echo "[$IMAGE] Build complete."
