/**
 * Script to generate app icon.png with midnight blue background and yellow "^" symbol
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
    console.log('🎨 Generating app icon.png...');
    
    // Create SVG for the "^" symbol on midnight blue background
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Midnight blue background -->
        <rect width="${size}" height="${size}" fill="${colors.midnightBlue}" rx="180"/>
        
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

    // Generate main icon.png
    const iconBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    const iconPath = path.join(__dirname, 'assets/images/icon.png');
    fs.writeFileSync(iconPath, iconBuffer);
    console.log('✅ Generated icon.png successfully!');
    console.log(`   Location: ${iconPath}`);
    console.log(`   Size: ${size}x${size}px`);
    console.log(`   Background: ${colors.midnightBlue} (Midnight Blue)`);
    console.log(`   Icon: ${colors.yellow} (Yellow "^" symbol)`);
    
  } catch (error) {
    console.error('❌ Error generating icon:', error);
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('\n💡 Make sure sharp is installed:');
      console.log('   npm install sharp --save-dev');
    }
    process.exit(1);
  }
}

generateIcon();
