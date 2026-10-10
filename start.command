#!/bin/bash
cd "$(dirname "$0")"
if ! docker info >/dev/null 2>&1; then
  echo "Starting Docker Desktop, please wait..."
  open -a Docker
  until docker info >/dev/null 2>&1; do sleep 2; done
fi
(until curl -s -o /dev/null http://localhost:5173; do sleep 2; done; open http://localhost:5173) &
docker compose up --build
