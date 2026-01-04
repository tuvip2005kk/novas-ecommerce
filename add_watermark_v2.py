from PIL import Image, ImageDraw, ImageFont
import os
import shutil

# Correct source paths from Artifact directory to V2 destination paths
# Source files (from artifacts dir - I need to be careful with names)
# I'll rely on copying from the Generated Paths. 
# BUT the generated path names are complex with timestamps.
# I'll manually map them based on the context above.

src_mapping = {
    "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_toilet_v2_1767180066754.png": "f:/do an/frontend/public/images/products/toilet/cat-toilet-v2.png",
    "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_lavabo_v2_1767180080291.png": "f:/do an/frontend/public/images/products/lavabo/cat-lavabo-v2.png",
    "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_shower_v2_1767180095359.png": "f:/do an/frontend/public/images/products/shower/cat-shower-v2.png",
    "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_bathtub_v2_1767180112157.png": "f:/do an/frontend/public/images/products/bathtub/cat-bathtub-v2.png",
    "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_accessories_v2_1767180128159.png": "f:/do an/frontend/public/images/products/accessories/cat-accessories-v2.png"
}

def process_image(src, dst):
    if not os.path.exists(src):
        print(f"Source missing: {src}")
        return

    # 1. Copy to dest
    # Ensure dir exists
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    
    # 2. Open and Badge
    try:
        img = Image.open(dst).convert("RGBA")
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 46) # Slightly bigger
        except:
            font = ImageFont.load_default()

        text = "Novas"
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        bg_color = (20, 30, 120, 255) # Deep Blue
        
        # New Position: SAFE ZONE (40px)
        start_x = 40 
        start_y = 40
        
        feature_height = 70
        feature_width = text_width + 50
        
        # Rounded Rect
        draw.rounded_rectangle(
            [(start_x, start_y), (start_x + feature_width, start_y + feature_height)],
            radius=15,
            fill=bg_color,
            outline=None
        )
        
        # Text
        text_x = start_x + (feature_width - text_width) / 2
        text_y = start_y + (feature_height - text_height) / 2 - 8
        
        draw.text((text_x, text_y), text, fill="white", font=font)
        
        img = img.convert("RGB")
        img.save(dst)
        print(f"Created: {dst}")
        
    except Exception as e:
        print(f"Error processing {dst}: {e}")

for s, d in src_mapping.items():
    process_image(s, d)
