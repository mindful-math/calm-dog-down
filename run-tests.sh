#!/bin/bash
# Simple test runner that logs history to tests.log

LOG_FILE="tests.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "--------------------------------------------------" >> $LOG_FILE
echo "Test Run: $TIMESTAMP" >> $LOG_FILE
echo "--------------------------------------------------" >> $LOG_FILE

# Run tests and capture output
npm test >> $LOG_FILE 2>&1
RESULT=$?

if [ $RESULT -eq 0 ]; then
  echo "RESULT: PASSED" >> $LOG_FILE
else
  echo "RESULT: FAILED" >> $LOG_FILE
fi

echo -e "\n" >> $LOG_FILE

# Also output to console for immediate feedback
if [ $RESULT -eq 0 ]; then
  echo "Tests passed. History updated in $LOG_FILE"
else
  echo "Tests failed. Check $LOG_FILE for details."
  exit 1
fi