#!/usr/bin/env node
/**
 * PepTrack Pro — Pre-publish validation script
 * Run from the frontend/ directory: node scripts/validate-publish.js
 * 
 * Checks that all Play Store requirements are met before building.
 */

const fs = require('fs');
const path = require('path');

const FRONTEND = path.resolve(__dirname, '..');
const ROOT = path.resolve(FRONTEND, '..');
let errors = 0;
let warnings = 0;

function check(condition, msg, isWarning = false) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
  } else if (isWarning) {
    console.log(`  ⚠️  ${msg}`);
    warnings++;
  } else {
    console.log(`  ❌ ${msg}`);
    errors++;
  }
}

console.log('\n🔍 PepTrack Pro — Pre-publish Validation\n');

// 1. Check app.json
console.log('📋 app.json');
const appJson = JSON.parse(fs.readFileSync(path.join(FRONTEND, 'app.json'), 'utf-8'));
const expo = appJson.expo;
check(expo.name, `App name: "${expo.name}"`);
check(expo.version, `Version: ${expo.version}`);
check(expo.android?.package, `Android package: ${expo.android?.package}`);
check(expo.android?.versionCode >= 1, `Version code: ${expo.android?.versionCode}`);
check(expo.android?.adaptiveIcon?.foregroundImage, 'Adaptive icon configured');
check(expo.android?.permissions?.length > 0, `Permissions: ${expo.android?.permissions?.join(', ')}`);
check(expo.extra?.eas?.projectId && expo.extra.eas.projectId !== 'peptrack-pro', 
  'EAS projectId is set (not placeholder)', true);

// 2. Check eas.json
console.log('\n📋 eas.json');
const easJson = JSON.parse(fs.readFileSync(path.join(FRONTEND, 'eas.json'), 'utf-8'));
check(easJson.build?.production?.android?.buildType === 'app-bundle', 'Production builds as AAB');
const prodEnv = easJson.build?.production?.env?.EXPO_PUBLIC_BACKEND_URL;
check(prodEnv && !prodEnv.includes('YOUR_'), 'Backend URL set in production env (not placeholder)', true);

// 3. Check assets
console.log('\n🎨 Assets');
const assetsDir = path.join(FRONTEND, 'assets', 'images');
check(fs.existsSync(path.join(assetsDir, 'icon.png')), 'icon.png exists');
check(fs.existsSync(path.join(assetsDir, 'adaptive-icon.png')), 'adaptive-icon.png exists');
check(fs.existsSync(path.join(assetsDir, 'splash-icon.png')), 'splash-icon.png exists');
check(fs.existsSync(path.join(assetsDir, 'feature-graphic.png')), 'feature-graphic.png exists (1024x500 for Play Store)');

// Check icon dimensions
try {
  const iconBuf = fs.readFileSync(path.join(assetsDir, 'icon.png'));
  // PNG header: width at bytes 16-19, height at bytes 20-23 (big-endian)
  const width = iconBuf.readUInt32BE(16);
  const height = iconBuf.readUInt32BE(20);
  check(width === 1024 && height === 1024, `Icon dimensions: ${width}x${height} (need 1024x1024)`);
} catch {}

// 4. Check privacy & legal docs
console.log('\n📜 Legal Pages');
const docsDir = path.join(ROOT, 'docs');
check(fs.existsSync(path.join(docsDir, 'privacy-policy.html')), 'Privacy policy HTML exists');
check(fs.existsSync(path.join(docsDir, 'terms-of-service.html')), 'Terms of service HTML exists');
check(fs.existsSync(path.join(docsDir, 'index.html')), 'Support/landing page exists');

// 5. Check env files
console.log('\n🔐 Environment');
check(fs.existsSync(path.join(FRONTEND, '.env.example')), 'Frontend .env.example exists');
check(fs.existsSync(path.join(ROOT, 'backend', '.env.example')), 'Backend .env.example exists');
check(!fs.existsSync(path.join(FRONTEND, 'google-service-account.json')), 'No service account key committed (good!)');

// 6. Check required files
console.log('\n📦 Store Listing');
check(fs.existsSync(path.join(FRONTEND, 'STORE_LISTING.md')), 'Store listing copy exists');
check(fs.existsSync(path.join(ROOT, 'PLAY_CONSOLE_CHEATSHEET.md')), 'Play Console form answers cheatsheet exists');

// 7. Check backend
console.log('\n🖥️  Backend');
check(fs.existsSync(path.join(ROOT, 'backend', 'server.py')), 'Backend server.py exists');
check(fs.existsSync(path.join(ROOT, 'backend', 'requirements.txt')), 'Backend requirements.txt exists');
check(fs.existsSync(path.join(ROOT, 'Procfile')), 'Procfile exists (Railway/Render)');
check(fs.existsSync(path.join(ROOT, 'Dockerfile')), 'Dockerfile exists');

// Summary
console.log('\n' + '─'.repeat(50));
if (errors === 0 && warnings === 0) {
  console.log('🎉 All checks passed! Ready to build.\n');
} else {
  if (errors > 0) console.log(`❌ ${errors} error(s) must be fixed before publishing.`);
  if (warnings > 0) console.log(`⚠️  ${warnings} warning(s) — should fix but won't block build.`);
  console.log('');
}

process.exit(errors > 0 ? 1 : 0);
