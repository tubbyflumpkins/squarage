# Image Processing Guide for Squarage Studio

## Hero Image Processing - White Background to Cream Conversion

### Overview
This guide documents the exact process for converting hero images with white backgrounds to match Squarage Studio's cream color scheme (#fffaf4) while preserving shadows and luminosity.

### Problem Solved
- Original images often have pure white backgrounds that clash with website's cream theme
- Standard color replacement destroys shadows and gradients
- Need to maintain natural shadow relationships while changing background tone

### Optimal Solution: +level-colors Method

#### Why This Method Works Best
1. **Preserves Luminosity Relationships** - Maps entire tonal range from black to cream
2. **Natural Shadow Preservation** - Shadows become cream-tinted rather than staying gray
3. **Maintains Gradations** - All subtle tones between black and white are preserved
4. **No Harsh Replacements** - Works with image's natural luminosity structure

#### Exact Command Structure
```bash
magick "source_image.jpg" \
  -resize 1920x1080^ \
  -gravity center \
  -extent 1920x1080 \
  +level-colors black,"#fffaf4" \
  -quality 85 \
  "output_image.jpg"
```

#### Step-by-Step Process

**Step 1: Source Image Preparation**
- Locate source image in project directory
- Ensure image has sufficient resolution for web optimization

**Step 2: Execute Processing Command**
```bash
magick "/path/to/source/image.jpg" \
  -resize 1920x1080^ \           # Resize to hero dimensions, maintain aspect ratio
  -gravity center \              # Center crop positioning
  -extent 1920x1080 \           # Crop to exact hero size
  +level-colors black,"#fffaf4" \ # Map white to Squarage cream color
  -quality 85 \                 # Web-optimized compression
  "/path/to/public/images/hero-main.jpg"
```

**Step 3: Verification**
- Check file size (should be ~250-350KB for optimized web performance)
- Verify background matches cream color (#fffaf4)
- Confirm shadows remain natural and well-preserved

#### Alternative Methods (If Primary Method Fails)

**Method 2: Luminosity Mask Approach**
```bash
magick "source.jpg" \
  -resize 1920x1080^ -gravity center -extent 1920x1080 \
  \( +clone -threshold 90% -blur 0x1 -fill "#fffaf4" -colorize 100% \) \
  \( +clone -threshold 90% -negate \) \
  -compose over -composite \
  -quality 85 "output.jpg"
```

**Method 3: Selective HSL Modification**
```bash
magick "source.jpg" \
  -resize 1920x1080^ -gravity center -extent 1920x1080 \
  -modulate 100,95,102 \        # Slight saturation/hue adjustment
  -quality 85 "output.jpg"
```

#### Color Reference
- **Squarage Cream**: #fffaf4
- **Squarage White**: #fffaf4 (same as cream)
- **Web Optimization**: 85% quality, ~300KB target size
- **Hero Dimensions**: 1920x1080px

#### Success Example
**Original Process Applied To**: `Squarage3731 2.jpg`
- **Source Size**: 5.5MB
- **Processed Size**: 272KB (95% reduction)
- **Result**: Perfect cream background with preserved shadows
- **Method Used**: +level-colors with #fffaf4 mapping

#### Troubleshooting

**If shadows look too gray:**
- Try increasing the cream color saturation slightly
- Use: `+level-colors black,"#fffbf6"` (slightly more saturated cream)

**If background isn't cream enough:**
- Verify hex color is correct: #fffaf4
- Check for quotes around color value in command

**If shadows are lost:**
- DO NOT use `-fuzz` or `-opaque` methods
- Always use `+level-colors` for luminosity preservation
- Avoid direct color replacement techniques

#### Performance Notes
- Always compress to 85% quality for web optimization
- Target file size: 250-400KB for hero images
- Use 1920x1080 dimensions for optimal display across devices
- Center gravity ensures best crop for hero sections

### Quick Reference Command
For future hero image processing:
```bash
magick "SOURCE_IMAGE" -resize 1920x1080^ -gravity center -extent 1920x1080 +level-colors black,"#fffaf4" -quality 85 "public/images/hero-main.jpg"
```

---
*Last Updated: July 2025*  
*Method Tested: Successfully applied to Squarage3731 2.jpg*