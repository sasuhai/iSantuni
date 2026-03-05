#!/bin/bash

# ==============================================================================
# Backup Script: Local Build -> GitHub (production branch)
# ==============================================================================
# This script pushes the latest production-ready build to GitHub for backup.
# ==============================================================================

PRODUCTION_BRANCH="production"

echo "💾 Starting Backup to GitHub for iSantuni..."

# Ensure we have a fresh build
if [ ! -d ".next/standalone" ]; then
    echo "📦 Building project locally..."
    npm run build
fi

# Prepare Deployment Folder
echo "📂 Preparing backup files..."
rm -rf backup_cache
mkdir -p backup_cache

cp -r .next/standalone/* backup_cache/
cp -r .next/standalone/.next backup_cache/
mkdir -p backup_cache/.next/static
cp -r .next/static/* backup_cache/.next/static/
cp -r public backup_cache/

# Create/Update the Deployment Branch (production)
echo "🌿 Updating '${PRODUCTION_BRANCH}' branch..."
GIT_DIR_TMP=$(mktemp -d)
cp -r .git $GIT_DIR_TMP/
cd backup_cache
git init > /dev/null
git remote add origin ../.git
git checkout -b $PRODUCTION_BRANCH 2>/dev/null || git checkout $PRODUCTION_BRANCH
git add .
git commit -m "Backup Build: $(date +'%Y-%m-%d %H:%M:%S')" > /dev/null
git push -f origin $PRODUCTION_BRANCH > /dev/null
cd ..
rm -rf backup_cache

echo "🌍 Pushing to GitHub '${PRODUCTION_BRANCH}'..."
git push origin $PRODUCTION_BRANCH --force

echo ""
echo "✅ BACKUP TO GITHUB COMPLETE!"
echo "----------------------------------------------------------------"
echo "👉 Repository: $(git remote get-url origin)"
echo "----------------------------------------------------------------"
