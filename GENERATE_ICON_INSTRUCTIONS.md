# How to Generate App Icons

## Quick Method (Using Script)

1. **Install sharp package:**
   ```bash
   cd ayuuto-mobile
   npm install sharp --save-dev
   ```

2. **Run the icon generation script:**
   ```bash
   npm run generate-icon
   ```

This will generate all required icon files with:
- **Background:** Midnight Blue (#011b3d)
- **Icon:** Yellow "^" symbol (#FFD700)

## Manual Method (Using Image Editor)

If you prefer to create the icons manually:

### Specifications:

1. **icon.png** (1024x1024px)
   - Background: Solid midnight blue (#011b3d)
   - Icon: Yellow "^" symbol (#FFD700) centered
   - Format: PNG

2. **android-icon-foreground.png** (1024x1024px)
   - Background: Transparent
   - Icon: Yellow "^" symbol (#FFD700) centered
   - Format: PNG with transparency

3. **android-icon-background.png** (1024x1024px)
   - Background: Solid midnight blue (#011b3d)
   - Format: PNG

4. **android-icon-monochrome.png** (1024x1024px)
   - Background: Transparent
   - Icon: Yellow "^" symbol (#FFD700)
   - Format: PNG with transparency

5. **favicon.png** (32x32px or 16x16px)
   - Background: Midnight blue (#011b3d)
   - Icon: Yellow "^" symbol (#FFD700)
   - Format: PNG

6. **splash-icon.png** (200x200px or larger)
   - Background: Transparent (splash screen has its own background)
   - Icon: Yellow "^" symbol (#FFD700)
   - Format: PNG with transparency

### Color Codes:
- **Midnight Blue:** `#011b3d` (RGB: 1, 27, 61)
- **Yellow:** `#FFD700` (RGB: 255, 215, 0)

### Tools You Can Use:
- **Figma** (free, web-based)
- **Adobe Illustrator/Photoshop**
- **Canva** (free, web-based)
- **GIMP** (free, open-source)
- **Online icon generators**

### Icon Design Tips:
- The "^" symbol should be centered
- Use a bold, clear "^" shape
- Ensure good contrast between yellow and midnight blue
- Test the icon at different sizes to ensure it's readable

## After Creating Icons

1. Replace the files in `assets/images/` directory
2. Rebuild your app:
   ```bash
   # For Android
   npx expo run:android
   
   # For iOS
   npx expo run:ios
   
   # Or build with EAS
   eas build --platform android
   ```

## Current Configuration

The `app.json` is already configured with:
- Android adaptive icon background: `#011b3d` (midnight blue)
- Icon paths pointing to the correct files

Once you update the icon image files, the app will use the new design!
