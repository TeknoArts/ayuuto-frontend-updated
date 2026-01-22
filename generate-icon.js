/**
 * Script to generate app icon with midnight blue background and yellow "^" symbol
 * 
 * This script requires sharp package: npm install sharp
 * Run: node generate-icon.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const colors = {
  midnightBlue: '#011b3d',
  yellow: '#FFD700',
};

const size = 1024;
const padding = 100;
const iconSize = size - (padding * 2);

async function generateIcon() {
  try {
    console.log('🎨 Generating app icon...');
    
    // Create SVG for the "^" symbol
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Midnight blue background -->
        <rect width="${size}" height="${size}" fill="${colors.midnightBlue}"/>
        
        <!-- Yellow "^" symbol (caret/chevron up) -->
        <path 
          d="M ${size/2} ${padding + iconSize * 0.2} 
             L ${padding + iconSize * 0.3} ${padding + iconSize * 0.7} 
             L ${size/2} ${padding + iconSize * 0.9} 
             L ${size - padding - iconSize * 0.3} ${padding + iconSize * 0.7} 
             Z" 
          fill="${colors.yellow}"
          stroke="${colors.yellow}"
          stroke-width="20"
          stroke-linejoin="round"
        />
      </svg>
    `;

    // Generate main icon
    const iconBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(__dirname, 'assets/images/icon.png'), iconBuffer);
    console.log('✅ Generated icon.png');

    // Generate Android foreground (transparent background, yellow icon)
    const androidForegroundSvg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Transparent background -->
        <rect width="${size}" height="${size}" fill="transparent"/>
        
        <!-- Yellow "^" symbol -->
        <path 
          d="M ${size/2} ${padding + iconSize * 0.2} 
             L ${padding + iconSize * 0.3} ${padding + iconSize * 0.7} 
             L ${size/2} ${padding + iconSize * 0.9} 
             L ${size - padding - iconSize * 0.3} ${padding + iconSize * 0.7} 
             Z" 
          fill="${colors.yellow}"
          stroke="${colors.yellow}"
          stroke-width="20"
          stroke-linejoin="round"
        />
      </svg>
    `;

    const foregroundBuffer = await sharp(Buffer.from(androidForegroundSvg))
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(__dirname, 'assets/images/android-icon-foreground.png'), foregroundBuffer);
    console.log('✅ Generated android-icon-foreground.png');

    // Generate Android background (solid midnight blue)
    const androidBackgroundSvg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${colors.midnightBlue}"/>
      </svg>
    `;

    const backgroundBuffer = await sharp(Buffer.from(androidBackgroundSvg))
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(__dirname, 'assets/images/android-icon-background.png'), backgroundBuffer);
    console.log('✅ Generated android-icon-background.png');

    // Generate Android monochrome (yellow icon, transparent background)
    fs.writeFileSync(path.join(__dirname, 'assets/images/android-icon-monochrome.png'), foregroundBuffer);
    console.log('✅ Generated android-icon-monochrome.png');

    // Generate favicon (smaller size)
    const faviconSvg = `
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="${colors.midnightBlue}"/>
        <path 
          d="M 16 6 L 10 20 L 16 26 L 22 20 Z" 
          fill="${colors.yellow}"
        />
      </svg>
    `;

    const faviconBuffer = await sharp(Buffer.from(faviconSvg))
      .png()
      .resize(32, 32)
      .toBuffer();
    
    fs.writeFileSync(path.join(__dirname, 'assets/images/favicon.png'), faviconBuffer);
    console.log('✅ Generated favicon.png');

    // Generate splash icon (larger, for splash screen)
    const splashSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <!-- Transparent background (splash screen has its own background) -->
        <rect width="200" height="200" fill="transparent"/>
        
        <!-- Yellow "^" symbol -->
        <path 
          d="M 100 20 L 30 120 L 100 170 L 170 120 Z" 
          fill="${colors.yellow}"
          stroke="${colors.yellow}"
          stroke-width="4"
          stroke-linejoin="round"
        />
      </svg>
    `;

    const splashBuffer = await sharp(Buffer.from(splashSvg))
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(__dirname, 'assets/images/splash-icon.png'), splashBuffer);
    console.log('✅ Generated splash-icon.png');

    console.log('\n🎉 All icons generated successfully!');
    console.log('\n📱 Next steps:');
    console.log('   1. Rebuild your app to see the new icons');
    console.log('   2. For iOS: npx expo run:ios');
    console.log('   3. For Android: npx expo run:android');
    console.log('   4. Or build with EAS: eas build --platform android');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    console.log('\n💡 Make sure sharp is installed:');
    console.log('   npm install sharp');
  }
}

generateIcon();
