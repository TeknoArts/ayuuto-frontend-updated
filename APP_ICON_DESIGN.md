# App Icon Design Requirements

## Design Specifications

**Background Color:** Midnight Blue (`#011b3d`)
**Icon Color:** Yellow (`#FFD700`)

## Icon Files to Update

The following icon image files need to be created/updated with the new design:

### Required Icon Files:

1. **`./assets/images/icon.png`** (1024x1024px)
   - Main app icon for iOS and general use
   - Background: Midnight Blue (#011b3d)
   - Icon graphic: Yellow (#FFD700)

2. **`./assets/images/android-icon-foreground.png`** (1024x1024px)
   - Android adaptive icon foreground
   - Icon graphic: Yellow (#FFD700)
   - Transparent background (will be placed on midnight blue background)

3. **`./assets/images/android-icon-background.png`** (1024x1024px)
   - Android adaptive icon background
   - Solid color: Midnight Blue (#011b3d)

4. **`./assets/images/android-icon-monochrome.png`** (1024x1024px)
   - Android monochrome icon
   - Yellow (#FFD700) icon on transparent background

5. **`./assets/images/favicon.png`** (32x32px or 16x16px)
   - Web favicon
   - Background: Midnight Blue (#011b3d)
   - Icon: Yellow (#FFD700)

6. **`./assets/images/splash-icon.png`** (200x200px or larger)
   - Splash screen icon
   - Icon: Yellow (#FFD700)
   - Transparent background (splash screen already has midnight blue background)

## Color Codes

- **Midnight Blue:** `#011b3d` (RGB: 1, 27, 61)
- **Yellow/Gold:** `#FFD700` (RGB: 255, 215, 0)

## Configuration Updated

The `app.json` has been updated with:
- Android adaptive icon background color: `#011b3d` (midnight blue)

## Next Steps

1. Create/update the icon image files with the new design
2. Ensure all icons have:
   - Midnight blue background (#011b3d)
   - Yellow icon graphic (#FFD700)
3. Rebuild the app to see the new icons

## Tools for Creating Icons

You can use:
- Figma
- Adobe Illustrator/Photoshop
- Online icon generators
- AI image generators

Make sure the icons are:
- High resolution (1024x1024px minimum)
- PNG format with transparency where needed
- Properly sized for each platform
