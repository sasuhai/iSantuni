#!/bin/bash

# Configuration
REMOTE_USER="u311693590"
REMOTE_HOST="151.106.124.161"
REMOTE_PORT="65002"
DOMAIN="isantuni.hidayahcentre.my"
APP_PATH="/home/u311693590/domains/${DOMAIN}/nodejs"

echo "📜 Fetching Deployment History from Hostinger..."
echo "----------------------------------------------------------------"
ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "tail -n 20 ${APP_PATH}/deployment_history.log" || echo "No history found yet."
echo "----------------------------------------------------------------"
