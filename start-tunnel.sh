#!/bin/bash

# Start Expo with Tunnel Mode
# This allows testing on mobile data, different WiFi, and different countries

echo "🚇 Starting Expo Tunnel Mode"
echo "============================"
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

# Kill any running Expo processes
echo "🛑 Stopping any running Expo processes..."
pkill -f expo 2>/dev/null || true
sleep 2

# Check if logged in
echo "📋 Checking Expo login status..."
if ! npx expo whoami &> /dev/null; then
    echo "⚠️  Not logged in to Expo"
    echo ""
    echo "🔐 Please login first:"
    echo "   npx expo login"
    echo ""
    read -p "Press Enter after logging in, or Ctrl+C to cancel..."
    echo ""
fi

# Show current user
echo "👤 Logged in as:"
npx expo whoami
echo ""

# Start with tunnel
echo "🚇 Starting Expo with tunnel mode..."
echo "   This will create a secure connection that works from any network!"
echo "   - Mobile data ✅"
echo "   - Different WiFi ✅"
echo "   - Different countries ✅"
echo ""
echo "⏳ Starting tunnel (this may take a moment)..."
echo ""

# Start Expo with tunnel and clear cache
npx expo start --clear --tunnel

echo ""
echo "✅ Tunnel started!"
echo ""
echo "📱 Next steps:"
echo "   1. Wait for QR code to appear"
echo "   2. Scan QR code with Expo Go app"
echo "   3. Or manually enter the tunnel URL shown"
echo "   4. Test on mobile data or different WiFi!"
echo ""
echo "🌐 Your backend API is on DigitalOcean, so API calls work from anywhere!"
