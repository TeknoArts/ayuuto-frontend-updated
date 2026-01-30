#!/bin/bash

# Build APK for Testing on Any Network
# This script builds a standalone APK that works on mobile data, different WiFi, and different countries

echo "🚀 Building Ayuuto APK for Any Network Testing"
echo "================================================"
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check if logged in
echo "📋 Checking Expo login status..."
if ! eas whoami &> /dev/null; then
    echo "⚠️  Not logged in to Expo"
    echo "🔐 Please login:"
    eas login
    echo ""
fi

# Show current user
echo "👤 Logged in as:"
eas whoami
echo ""

# Show project info
echo "📦 Project Info:"
eas project:info
echo ""

# Confirm build
echo "🔨 Starting APK build..."
echo "   Platform: Android"
echo "   Profile: Preview (for testing)"
echo "   This will take ~10-15 minutes"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Build the APK
echo ""
echo "🏗️  Building APK (this may take 10-15 minutes)..."
eas build --platform android --profile preview

echo ""
echo "✅ Build complete!"
echo ""
echo "📥 Next steps:"
echo "   1. Download the APK from the link above"
echo "   2. Transfer to your Android device"
echo "   3. Enable 'Install from Unknown Sources' in Android settings"
echo "   4. Install the APK"
echo "   5. Test on mobile data, different WiFi, or different countries!"
echo ""
echo "🌐 Your backend is on DigitalOcean, so API calls will work from anywhere!"
