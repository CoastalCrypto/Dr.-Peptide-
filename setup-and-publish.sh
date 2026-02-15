#!/bin/bash
# PepTrack Pro — Quick Setup & Publish Script
# Run this from the root of the repository after cloning.
#
# Prerequisites:
#   - Node.js 18+
#   - npm / yarn
#   - eas-cli: npm install -g eas-cli
#   - An Expo account (https://expo.dev/signup)
#   - A Google Play Developer account
#
# Usage:
#   chmod +x setup-and-publish.sh
#   ./setup-and-publish.sh

set -e

echo ""
echo "🧬 PepTrack Pro — Setup & Publish"
echo "══════════════════════════════════"
echo ""

# ───── Step 1: Merge branch ─────
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "📌 Merging $CURRENT_BRANCH into main..."
  git checkout main 2>/dev/null || git checkout -b main
  git merge "$CURRENT_BRANCH" --allow-unrelated-histories --no-edit || {
    echo "⚠️  Merge conflicts detected. Resolve them, then re-run."
    exit 1
  }
  git push origin main
  echo "✅ Code merged to main branch"
else
  echo "✅ Already on main branch"
fi

# ───── Step 2: Install dependencies ─────
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps || yarn install
echo "✅ Dependencies installed"

# ───── Step 3: Link Expo project ─────
echo ""
echo "🔗 Linking to Expo (EAS)..."
if ! command -v eas &> /dev/null; then
  echo "Installing eas-cli..."
  npm install -g eas-cli
fi

echo ""
echo "📝 Log in to your Expo account:"
eas login

echo ""
echo "📝 Initializing EAS project..."
eas init
echo "✅ Expo project linked"

# ───── Step 4: Set backend URL ─────
echo ""
echo "═══════════════════════════════════════════════"
echo "🖥️  BACKEND URL NEEDED"
echo ""
echo "You need to deploy the backend first. Quick options:"
echo "  • Railway: https://railway.app (auto-deploys from GitHub)"
echo "  • Render:  https://render.com (has free tier)"
echo ""
echo "Once deployed, enter your backend URL below."
echo "Example: https://drpeptide-production.up.railway.app"
echo ""
read -p "Backend URL: " BACKEND_URL

if [ -n "$BACKEND_URL" ]; then
  # Update eas.json production env
  # Using node since sed on macOS is different
  node -e "
    const fs = require('fs');
    const eas = JSON.parse(fs.readFileSync('eas.json', 'utf-8'));
    eas.build.production.env = eas.build.production.env || {};
    eas.build.production.env.EXPO_PUBLIC_BACKEND_URL = '$BACKEND_URL';
    eas.build.preview.env = eas.build.preview.env || {};
    eas.build.preview.env.EXPO_PUBLIC_BACKEND_URL = '$BACKEND_URL';
    fs.writeFileSync('eas.json', JSON.stringify(eas, null, 2));
  "
  echo "✅ Backend URL set in eas.json"
fi

# ───── Step 5: Validate ─────
echo ""
echo "🔍 Running pre-publish validation..."
node scripts/validate-publish.js

# ───── Step 6: Build ─────
echo ""
echo "═══════════════════════════════════════════════"
read -p "🔨 Ready to build production AAB? (y/n): " BUILD_CONFIRM

if [ "$BUILD_CONFIRM" = "y" ] || [ "$BUILD_CONFIRM" = "Y" ]; then
  echo ""
  echo "🔨 Building Android production AAB..."
  echo "   (This takes ~15-20 minutes on EAS cloud)"
  echo ""
  eas build --platform android --profile production
  echo ""
  echo "✅ Build complete! Download the AAB from the link above."
  echo ""
  echo "═══════════════════════════════════════════════"
  echo "📱 NEXT STEPS:"
  echo "  1. Enable GitHub Pages: Settings → Pages → Branch: main, Folder: /docs"
  echo "  2. Go to https://play.google.com/console"
  echo "  3. Create App → Fill in forms using PLAY_CONSOLE_CHEATSHEET.md"
  echo "  4. Upload the .aab file to Testing → Internal testing"
  echo "  5. Test on your phone, then promote to Production"
  echo "═══════════════════════════════════════════════"
else
  echo ""
  echo "Skipped build. Run manually when ready:"
  echo "  cd frontend && eas build --platform android --profile production"
fi

echo ""
echo "🎉 Setup complete!"
