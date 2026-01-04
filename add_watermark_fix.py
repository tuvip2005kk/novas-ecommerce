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
        img = Image.open(image_path).convert("RGBA")
        
        # Reloading image resets it, but we overwrote previous badge with new one potentially
        # Best to reload if possible from source or just draw over heavily.
        # Actually since I'm overwriting, drawing over the previous badge location (0,20) with a new one at (20,20) might leave artifacts if not careful.
        # BUT, the background is complex.
        # Ideally I should have kept originals. 
        # Since I don't have originals backed up easily in this script, I'll rely on the fact that I'm drawing a BIGGER or same box, but user says "khuất" (hidden/cut off)
        # This means it was too close to the edge (0,20).
        # I will move it to (0, 0) but ensure the text is visible, or move it INWARDS to (20, 20).
        
        # Wait, if I draw over the old one, the old one is baked in. Drawing a new one elsewhere will leave TWO badges.
        # I must Re-Copy the source images first if I want to "move" it cleanly.
        # Luckily I have the originals in `.gemini` folder!
        
        # Mapping for safety restoration:
        source_map = {
             "f:/do an/frontend/public/images/products/toilet/cat-toilet-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_toilet_branded_1767179502409.png",
             "f:/do an/frontend/public/images/products/lavabo/cat-lavabo-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_lavabo_branded_1767179516610.png",
             "f:/do an/frontend/public/images/products/shower/cat-shower-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_shower_branded_1767179532102.png",
             "f:/do an/frontend/public/images/products/bathtub/cat-bathtub-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_bathtub_branded_1767179545442.png",
             "f:/do an/frontend/public/images/products/accessories/cat-accessories-brand.png": "C:/Users/Admin/.gemini/antigravity/brain/9ec39fa3-c444-46fa-83ef-2cb12bd5d665/novas_accessories_branded_1767179559790.png"
        }
        
        if image_path in source_map and os.path.exists(source_map[image_path]):
             img = Image.open(source_map[image_path]).convert("RGBA")
        
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
        
        # New Position: Shifted INWARDS to avoid cut off
        # Start X shifted right by 20 pixels instead of 0
        start_x = 20 
        start_y = 20
        
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
        print(f"Badged (Fixed): {image_path}")
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

for path in images:
    add_badge(path)
