#!/bin/bash

# Fix Metro Bundler Cache Issue for react-native-is-edge-to-edge

echo "🔧 Fixing Metro Bundler Cache Issue"
echo "===================================="
echo ""

cd "$(dirname "$0")"

echo "📦 Step 1: Stopping Expo..."
pkill -f expo 2>/dev/null || true
sleep 2

echo "🧹 Step 2: Clearing Metro bundler cache..."
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --clear --tunnel &
EXPO_PID=$!
sleep 3
kill $EXPO_PID 2>/dev/null || true

echo ""
echo "📥 Step 3: Verifying package is installed..."
if [ -d "node_modules/react-native-is-edge-to-edge" ]; then
    echo "✅ Package exists in node_modules"
else
    echo "⚠️  Package not found, reinstalling..."
    npm install react-native-is-edge-to-edge
fi

echo ""
echo "✅ Cache cleared!"
echo ""
echo "🚀 Now restart Expo:"
echo "   npm start"
echo ""
echo "Or run:"
echo "   npx expo start --clear --tunnel"
