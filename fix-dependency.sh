#!/bin/bash

# Fix missing react-native-is-edge-to-edge dependency

echo "🔧 Fixing Missing Dependency"
echo "============================"
echo ""

cd "$(dirname "$0")"

echo "📦 Step 1: Installing missing dependency..."
npm install react-native-is-edge-to-edge

echo ""
echo "🧹 Step 2: Clearing Metro bundler cache..."
npx expo start --clear

echo ""
echo "✅ Done! The dependency should now be installed."
echo ""
echo "If you still see errors, try:"
echo "  1. Stop Expo (Ctrl+C)"
echo "  2. Delete node_modules: rm -rf node_modules"
echo "  3. Reinstall: npm install"
echo "  4. Start again: npx expo start --tunnel"
