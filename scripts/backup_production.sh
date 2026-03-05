#!/bin/bash

# Configuration
GITHUB_BRANCH="production"

echo "🔄 Starting GitHub Production Backup..."

# 1. Local Build
echo "📦 Step 1: Building project locally..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Local build failed. Backup aborted."
    exit 1
fi

# 2. Sync to Branch
echo "📤 Step 2: Syncing build artifacts to '${GITHUB_BRANCH}' branch..."
# Use a temporary directory to avoid messing with current git state
TEMP_DIR="production_backup_tmp"
rm -rf ${TEMP_DIR}
mkdir -p ${TEMP_DIR}

if [ -d ".next/standalone" ]; then
    cp -r .next/standalone/* ${TEMP_DIR}/
    cp -r .next/standalone/.next ${TEMP_DIR}/
    mkdir -p ${TEMP_DIR}/.next/static
    cp -r .next/static/* ${TEMP_DIR}/.next/static/
    cp -r public ${TEMP_DIR}/
else
    echo "❌ Error: .next/standalone not found."
    rm -rf ${TEMP_DIR}
    exit 1
fi

# 3. Git Push
cd ${TEMP_DIR}
git init
git remote add origin $(git -C .. remote get-url origin)
git checkout -b ${GITHUB_BRANCH}
git add .
git commit -m "Production Build: $(date)"
git push origin ${GITHUB_BRANCH} --force

cd ..
rm -rf ${TEMP_DIR}

echo "✅ Backup to GitHub '${GITHUB_BRANCH}' branch complete!"
