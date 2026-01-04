from PIL import Image, ImageDraw, ImageFont
import os

images = [
    "f:/do an/frontend/public/images/products/toilet/cat-toilet-brand.png",
    "f:/do an/frontend/public/images/products/lavabo/cat-lavabo-brand.png",
    "f:/do an/frontend/public/images/products/shower/cat-shower-brand.png",
    "f:/do an/frontend/public/images/products/bathtub/cat-bathtub-brand.png",
    "f:/do an/frontend/public/images/products/accessories/cat-accessories-brand.png"
]

def add_badge(image_path):
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return

    try:
        # Re-source from backup to avoid multi-badge mess if possible, 
        # but since I don't have easy access to clean raw images right now without re-generation or copy,
        # I will just draw a NEW badge at a SAFE location (50, 50).
        # The old badge (20,20) will still be there underneath or partially visible if I don't cover it?
        # AHH, if I draw 50,50 the old 20,20 badge will still be there!
        # I MUST restore from the source in .gemini folder to clean it up.
        
        source_map = {
             "f:/do an/frontend/public/images/products/toilet/cat-toilet-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_toilet_branded_1767179502409.png",
             "f:/do an/frontend/public/images/products/lavabo/cat-lavabo-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_lavabo_branded_1767179516610.png",
             "f:/do an/frontend/public/images/products/shower/cat-shower-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_shower_branded_1767179532102.png",
             "f:/do an/frontend/public/images/products/bathtub/cat-bathtub-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_bathtub_branded_1767179545442.png",
             "f:/do an/frontend/public/images/products/accessories/cat-accessories-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_accessories_branded_1767179559790.png"
        }
        
        if image_path in source_map and os.path.exists(source_map[image_path]):
             img = Image.open(source_map[image_path]).convert("RGBA")
        else:
             # If source missing, just open current (might have artifacts)
             img = Image.open(image_path).convert("RGBA")

        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 42)
        except:
            font = ImageFont.load_default()

        text = "Novas"
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        bg_color = (20, 30, 120, 255) 
        
        # New Position: SAFE ZONE (50px from edge to clear any border radius)
        start_x = 40 
        start_y = 40
        
        feature_height = 60
        feature_width = text_width + 50
        
        # Rounded Rect
        draw.rounded_rectangle(
            [(start_x, start_y), (start_x + feature_width, start_y + feature_height)],
            radius=12,
            fill=bg_color,
            outline=None
        )
        
        # Text
        text_x = start_x + (feature_width - text_width) / 2
        text_y = start_y + (feature_height - text_height) / 2 - 6
        
        draw.text((text_x, text_y), text, fill="white", font=font)
        
        img = img.convert("RGB")
        img.save(image_path)
        print(f"Badged (Safe): {image_path}")
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

for path in images:
    add_badge(path)
