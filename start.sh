#!/usr/bin/env bash

set -e
echo "Starting dog-calm-down..."
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Please install Node.js >= 18."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install nodemailer twilio
fi

echo "Starting server..."
node server.js &
SERVER_PID=$!

sleep 1
echo "Opening app at http://localhost:3747..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:3747"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open "http://localhost:3747" >/dev/null 2>&1 || sensible-browser "http://localhost:3747"
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32" ]]; then
  start "http://localhost:3747"
else
  echo "Could not detect OS. Please open index.html manually."
fi

trap "echo 'Stopping server...'; kill $SERVER_PID" EXIT

wait $SERVER_PID