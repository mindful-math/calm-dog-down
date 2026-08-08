#!/usr/bin/env bash
set -e

echo "Running Integration Tests..."

# 1. Check if server is responding
echo "Checking server health..."
curl -s http://localhost:3747/config > /dev/null
if [ $? -eq 0 ]; then
  echo "Server is responding"
else
  echo "Server is not responding"
  exit 1
fi

# 2. Check if Groq API key is sourced from .env
echo "Checking Groq API key sourcing..."
CONFIG=$(curl -s http://localhost:3747/config)
if echo "$CONFIG" | grep -q "groqApiKey" && [[ $(echo "$CONFIG" | grep -o '"groqApiKey":"[^"]*"' | cut -d'"' -f4) != "" ]]; then
  echo "Groq API key is sourced"
else
  echo "Groq API key is missing or empty in config"
  exit 1
fi

# 3. Test Groq connectivity
echo "Testing Groq API connectivity..."
GROQ_KEY=$(grep GROQ_API_KEY .env | cut -d '=' -f2)
RESPONSE=$(curl -s -X POST http://localhost:3747/test-groq-key \
  -H "Content-Type: application/json" \
  -d "{\"apiKey\": \"$GROQ_KEY\"}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "Groq API connectivity verified"
else
  echo "Groq API connectivity failed: $RESPONSE"
  exit 1
fi

echo "All integration tests passed!"