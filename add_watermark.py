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
        draw = ImageDraw.Draw(img)
        
        # Load font - bigger and bold
        try:
            # Try to load Arial bold
            font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 48)
        except:
            font = ImageFont.load_default()

        text = "Novas"
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        # Badge dimensions similar to "Enic" - Blue tag top left
        bg_color = (20, 30, 120, 255) # Deep Blue like "Enic"
        
        # Tag shape: Rectangle with cut corner or rounded right side
        # Let's do a simple rounded rectangle on the top left
        
        padding_x = 20
        padding_y = 10
        
        feature_height = 70
        feature_width = text_width + 50
        
        # Position 0,0 - stick to top left corner
        start_x = 0
        start_y = 20
        
        # Draw background shape
        # Polygon for angled look? Or just rounded rect.
        # Enic logo is a blue shape with rounded right side.
        
        draw.rounded_rectangle(
            [(start_x - 20, start_y), (start_x + feature_width, start_y + feature_height)],
            radius=15,
            fill=bg_color,
            outline=None
        )
        
        # Draw Text
        text_x = start_x + 15
        text_y = start_y + (feature_height - text_height) / 2 - 10
        
        draw.text((text_x, text_y), text, fill="white", font=font)
        
        # Save back
        img = img.convert("RGB")
        img.save(image_path)
        print(f"Badged: {image_path}")
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

for path in images:
    add_badge(path)
