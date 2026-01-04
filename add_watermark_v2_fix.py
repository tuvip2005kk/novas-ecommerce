from PIL import Image, ImageDraw, ImageFont
import os

# We will modify the existing v2 images in place.
# The old badge at x=40 will be hidden by the crop, so it's fine to leave it there.
images = [
    "f:/do an/frontend/public/images/products/toilet/cat-toilet-v2.png",
    "f:/do an/frontend/public/images/products/lavabo/cat-lavabo-v2.png",
    "f:/do an/frontend/public/images/products/shower/cat-shower-v2.png",
    "f:/do an/frontend/public/images/products/bathtub/cat-bathtub-v2.png",
    "f:/do an/frontend/public/images/products/accessories/cat-accessories-v2.png"
]

def add_badge(image_path):
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return

    try:
        img = Image.open(image_path).convert("RGBA")
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 46)
        except:
            font = ImageFont.load_default()

        text = "Novas"
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        bg_color = (20, 30, 120, 255) # Deep Blue
        
        # New Position: CALCULATED SAFE ZONE
        # Image is 1024 wide. Container is 3:4 aspect. Visible width is 0.75 * Height.
        # Img Height = 1024. Visible Width = 768.
        # Cropped from left = (1024 - 768) / 2 = 128px.
        # We need to be > 128px. Plus margin 20px. Plus Border Radius safety.
        # Let's target x = 160.
        
        start_x = 160 
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
        img.save(image_path)
        print(f"Badged (Deep Safe): {image_path}")
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

for path in images:
    add_badge(path)
