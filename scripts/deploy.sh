#!/bin/bash

# ==============================================================================
# Master Deployment Script: Mac -> Hostinger (Direct)
# ==============================================================================
# Strategy:
# 1. Build Next.js app locally (standalone mode).
# 2. Package production-ready files.
# 3. Direct Sync (SSH) to Hostinger 'nodejs' folder.
# ==============================================================================

# Configuration
REMOTE_USER="u311693590"
REMOTE_HOST="151.106.124.161"
REMOTE_PORT="65002"
DOMAIN="isantuni.hidayahcentre.my"
APP_PATH="/home/u311693590/domains/${DOMAIN}/nodejs"
WEB_PATH="/home/u311693590/domains/${DOMAIN}/public_html"

echo "🚀 Starting Direct Deployment to Hostinger for iSantuni..."

# 1. Local Build
echo "📦 Step 1: Building project locally on your Mac..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Local build failed. Deployment aborted."
    exit 1
fi
echo "✅ Build successful!"

# 2. Prepare Deployment Folder
echo "📂 Step 2: Preparing production files..."
rm -rf deploy_cache
mkdir -p deploy_cache

# Copy the standalone Next.js files
if [ -d ".next/standalone" ]; then
    cp -r .next/standalone/* deploy_cache/
    cp -r .next/standalone/.next deploy_cache/
    mkdir -p deploy_cache/.next/static
    cp -r .next/static/* deploy_cache/.next/static/
    cp -r public deploy_cache/
else
    echo "❌ Error: .next/standalone not found. Ensure 'output: standalone' is in next.config.mjs."
    exit 1
fi

# Dummy out the 'lint' command to prevent failures
if [ -f "deploy_cache/package.json" ]; then
    sed -i '' 's/"lint": ".*"/"lint": "echo '\''Bundled Build Detected'\''"/' deploy_cache/package.json 2>/dev/null || sed -i 's/"lint": ".*"/"lint": "echo '\''Bundled Build Detected'\''"/' deploy_cache/package.json
fi

# 3. Direct Sync to Hostinger
echo "📤 Step 3: Fast-Syncing to Hostinger via Rsync..."
rsync -avz --progress --delete \
  -e "ssh -p ${REMOTE_PORT} -o ConnectTimeout=30" \
  deploy_cache/ ${REMOTE_USER}@${REMOTE_HOST}:${APP_PATH}/

# 4. Connect the Proxy Bridge & Update History
echo "🌉 Step 4: Setting up Hostinger Proxy Bridge & Logging..."
DEPLOY_TIME=$(date '+%Y-%m-%d %H:%M:%S')
ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << EOF
  cat > ${WEB_PATH}/.htaccess << 'HTACCESS'
PassengerAppRoot ${APP_PATH}
PassengerAppType node
PassengerNodejs /opt/alt/alt-nodejs22/root/bin/node
PassengerStartupFile server.js
PassengerBaseURI /
PassengerRestartDir ${APP_PATH}/tmp
RewriteEngine On
RewriteRule ^\.builds - [F,L]
HTACCESS

  # Update Deployment History Log
  echo "[${DEPLOY_TIME}] Deployed by local machine via direct sync" >> ${APP_PATH}/deployment_history.log
  
  # Trigger a Passenger restart
  mkdir -p ${APP_PATH}/tmp
  touch ${APP_PATH}/tmp/restart.txt
EOF

rm -rf deploy_cache

echo ""
echo "✨ DIRECT DEPLOYMENT COMPLETE!"
echo "----------------------------------------------------------------"
echo "🕒 Time: ${DEPLOY_TIME}"
echo "👉 Site: https://${DOMAIN}"
echo "----------------------------------------------------------------"

