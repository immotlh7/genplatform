#!/bin/bash

# GenPlatform Health Check Script
# This script should be run by cron every hour to collect system metrics

BRIDGE_API_URL="http://localhost:3001"
HEALTH_ENDPOINT="$BRIDGE_API_URL/api/health/collect"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting GenPlatform health check..."

# Check if Bridge API is running
if ! curl -s "$BRIDGE_API_URL/health" > /dev/null; then
    echo "[$TIMESTAMP] ERROR: Bridge API is not responding at $BRIDGE_API_URL"
    exit 1
fi

# Collect and save health metrics
RESPONSE=$(curl -s -X POST "$HEALTH_ENDPOINT" -H "Content-Type: application/json")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$HEALTH_ENDPOINT")

if [ "$HTTP_CODE" = "200" ]; then
    echo "[$TIMESTAMP] ✅ Health check completed successfully"
    echo "[$TIMESTAMP] Response: $RESPONSE"
else
    echo "[$TIMESTAMP] ⚠️  Health check failed with HTTP code: $HTTP_CODE"
    echo "[$TIMESTAMP] Response: $RESPONSE"
    exit 1
fi

echo "[$TIMESTAMP] Health check finished"