import os
import math
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = r"C:\Windows\Fonts\tahoma.ttf"

def get_font(size):
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except Exception:
        return ImageFont.load_default()

def draw_arrow(draw, start, end, color=(239, 68, 68), width=6, arrow_size=24):
    """Draw a smooth line with a sharp arrowhead at the end point."""
    x0, y0 = start
    x1, y1 = end
    
    # Line
    draw.line([start, end], fill=color, width=width)
    
    # Arrowhead angle
    angle = math.atan2(y1 - y0, x1 - x0)
    
    # Two points for arrowhead wings
    p1_x = x1 - arrow_size * math.cos(angle - math.pi / 6)
    p1_y = y1 - arrow_size * math.sin(angle - math.pi / 6)
    
    p2_x = x1 - arrow_size * math.cos(angle + math.pi / 6)
    p2_y = y1 - arrow_size * math.sin(angle + math.pi / 6)
    
    draw.polygon([(x1, y1), (p1_x, p1_y), (p2_x, p2_y)], fill=color)

def draw_badge(draw, center, text, font, bg_color=(239, 68, 68), text_color=(255, 255, 255), radius=32):
    """Draw circular numbered badge with shadow."""
    cx, cy = center
    
    # Dark shadow
    draw.ellipse([cx - radius + 3, cy - radius + 3, cx + radius + 3, cy + radius + 3], fill=(0, 0, 0, 180))
    # Outer ring
    draw.ellipse([cx - radius - 2, cy - radius - 2, cx + radius + 2, cy + radius + 2], fill=(255, 255, 255))
    # Main Circle
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=bg_color)
    
    # Text centered
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw / 2, cy - th / 2 - 2), text, fill=text_color, font=font)

def draw_callout_box(draw, bbox, color=(239, 68, 68), width=5):
    """Draw rounded or rectangle callout box."""
    x0, y0, x1, y1 = bbox
    # Outer glow / shadow
    draw.rounded_rectangle([x0 - 2, y0 - 2, x1 + 2, y1 + 2], radius=16, outline=(0, 0, 0), width=width + 2)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=14, outline=color, width=width)

def annotate_cashier():
    im = Image.open(r"C:\web\mookata-buffet\shot_cashier.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    font_badge = get_font(36)
    
    # 1. View Switcher
    box1 = (1430, 20, 2370, 95)
    draw_callout_box(draw, box1, color=(59, 130, 246))
    draw_arrow(draw, (1400, 160), (1480, 95), color=(59, 130, 246), width=7)
    draw_badge(draw, (1360, 180), "1", font_badge, bg_color=(59, 130, 246), radius=32)
    
    # 2. Table Status Count
    box2 = (1820, 150, 2100, 235)
    draw_callout_box(draw, box2, color=(16, 185, 129))
    draw_arrow(draw, (1800, 310), (1920, 240), color=(16, 185, 129), width=7)
    draw_badge(draw, (1780, 340), "2", font_badge, bg_color=(16, 185, 129), radius=32)
    
    # 3. Stock Management
    box3 = (2120, 150, 2350, 235)
    draw_callout_box(draw, box3, color=(245, 158, 11))
    draw_arrow(draw, (2220, 320), (2230, 240), color=(245, 158, 11), width=7)
    draw_badge(draw, (2220, 360), "3", font_badge, bg_color=(245, 158, 11), radius=32)
    
    # 4. Available Table 01
    box4 = (70, 270, 440, 610)
    draw_callout_box(draw, box4, color=(34, 197, 94))
    draw_arrow(draw, (250, 690), (250, 610), color=(34, 197, 94), width=7)
    draw_badge(draw, (250, 730), "4", font_badge, bg_color=(34, 197, 94), radius=32)
    
    # 5. Occupied Table 02
    box5 = (460, 270, 830, 610)
    draw_callout_box(draw, box5, color=(249, 115, 22))
    draw_arrow(draw, (640, 690), (640, 610), color=(249, 115, 22), width=7)
    draw_badge(draw, (640, 730), "5", font_badge, bg_color=(249, 115, 22), radius=32)

    im.convert("RGB").save(r"C:\web\mookata-buffet\annotated_cashier.png")
    print("annotated_cashier.png saved.")

def annotate_qr_modal():
    im = Image.open(r"C:\web\mookata-buffet\shot_qr_modal.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    font_badge = get_font(36)
    
    # Modal boundary roughly: 810, 260 to 1590, 1340
    # 1. Table & Token Info
    box1 = (840, 280, 1300, 380)
    draw_callout_box(draw, box1, color=(59, 130, 246))
    draw_arrow(draw, (700, 330), (840, 330), color=(59, 130, 246), width=7)
    draw_badge(draw, (650, 330), "1", font_badge, bg_color=(59, 130, 246), radius=32)
    
    # 2. QR Code
    box2 = (940, 420, 1460, 940)
    draw_callout_box(draw, box2, color=(239, 68, 68))
    draw_arrow(draw, (700, 680), (940, 680), color=(239, 68, 68), width=7)
    draw_badge(draw, (650, 680), "2", font_badge, bg_color=(239, 68, 68), radius=32)
    
    # 3. Simulate Customer Scan Button
    box3 = (870, 1080, 1530, 1170)
    draw_callout_box(draw, box3, color=(249, 115, 22))
    draw_arrow(draw, (700, 1125), (870, 1125), color=(249, 115, 22), width=7)
    draw_badge(draw, (650, 1125), "3", font_badge, bg_color=(249, 115, 22), radius=32)
    
    # 4. Print Slip Button
    box4 = (870, 1180, 1530, 1270)
    draw_callout_box(draw, box4, color=(16, 185, 129))
    draw_arrow(draw, (700, 1225), (870, 1225), color=(16, 185, 129), width=7)
    draw_badge(draw, (650, 1225), "4", font_badge, bg_color=(16, 185, 129), radius=32)

    im.convert("RGB").save(r"C:\web\mookata-buffet\annotated_qr_modal.png")
    print("annotated_qr_modal.png saved.")

def annotate_customer():
    im = Image.open(r"C:\web\mookata-buffet\shot_customer.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    font_badge = get_font(28)
    
    # 1. Table Info
    box1 = (20, 95, 420, 200)
    draw_callout_box(draw, box1, color=(59, 130, 246), width=4)
    draw_arrow(draw, (140, 270), (200, 200), color=(59, 130, 246), width=5)
    draw_badge(draw, (140, 305), "1", font_badge, bg_color=(59, 130, 246), radius=26)
    
    # 2. Timer (90 mins countdown)
    box2 = (600, 95, 820, 200)
    draw_callout_box(draw, box2, color=(16, 185, 129), width=4)
    draw_arrow(draw, (710, 270), (710, 200), color=(16, 185, 129), width=5)
    draw_badge(draw, (710, 305), "2", font_badge, bg_color=(16, 185, 129), radius=26)
    
    # 3. Dessert Self-service Notice
    box3 = (20, 350, 820, 520)
    draw_callout_box(draw, box3, color=(236, 72, 153), width=4)
    draw_arrow(draw, (100, 590), (140, 520), color=(236, 72, 153), width=5)
    draw_badge(draw, (100, 625), "3", font_badge, bg_color=(236, 72, 153), radius=26)
    
    # 4. Food Category Tabs
    box4 = (20, 535, 820, 640)
    draw_callout_box(draw, box4, color=(245, 158, 11), width=4)
    draw_arrow(draw, (700, 710), (600, 640), color=(245, 158, 11), width=5)
    draw_badge(draw, (700, 745), "4", font_badge, bg_color=(245, 158, 11), radius=26)
    
    # 5. Food Menu Item with Qty buttons
    box5 = (20, 660, 820, 940)
    draw_callout_box(draw, box5, color=(249, 115, 22), width=4)
    draw_arrow(draw, (720, 850), (620, 850), color=(249, 115, 22), width=5)
    draw_badge(draw, (765, 850), "5", font_badge, bg_color=(249, 115, 22), radius=26)
    
    # 6. Service Bell Button (Bottom left)
    box6 = (25, 1665, 165, 1815)
    draw_callout_box(draw, box6, color=(234, 179, 8), width=4)
    draw_arrow(draw, (95, 1570), (95, 1665), color=(234, 179, 8), width=5)
    draw_badge(draw, (95, 1535), "6", font_badge, bg_color=(234, 179, 8), radius=26)

    # 7. Order History Button (Bottom middle)
    box7 = (175, 1665, 305, 1815)
    draw_callout_box(draw, box7, color=(59, 130, 246), width=4)
    draw_arrow(draw, (240, 1570), (240, 1665), color=(59, 130, 246), width=5)
    draw_badge(draw, (240, 1535), "7", font_badge, bg_color=(59, 130, 246), radius=26)

    # 8. Cart / Submit Order Button (Bottom right)
    box8 = (320, 1665, 815, 1815)
    draw_callout_box(draw, box8, color=(239, 68, 68), width=4)
    draw_arrow(draw, (560, 1570), (560, 1665), color=(239, 68, 68), width=5)
    draw_badge(draw, (560, 1535), "8", font_badge, bg_color=(239, 68, 68), radius=26)

    im.convert("RGB").save(r"C:\web\mookata-buffet\annotated_customer.png")
    print("annotated_customer.png saved.")

def annotate_kitchen():
    im = Image.open(r"C:\web\mookata-buffet\shot_kitchen.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    font_badge = get_font(36)
    
    # 1. KDS Title & Real-time Indicator
    box1 = (70, 130, 750, 240)
    draw_callout_box(draw, box1, color=(59, 130, 246))
    draw_arrow(draw, (350, 310), (350, 240), color=(59, 130, 246), width=7)
    draw_badge(draw, (350, 350), "1", font_badge, bg_color=(59, 130, 246), radius=32)
    
    # 2. Sound Toggle Button
    box2 = (2050, 140, 2350, 235)
    draw_callout_box(draw, box2, color=(16, 185, 129))
    draw_arrow(draw, (2200, 310), (2200, 240), color=(16, 185, 129), width=7)
    draw_badge(draw, (2200, 350), "2", font_badge, bg_color=(16, 185, 129), radius=32)
    
    # 3. Urgent Service Banner (ขอถ่าน/เปลี่ยนกระทะ)
    box3 = (70, 260, 2330, 440)
    draw_callout_box(draw, box3, color=(245, 158, 11))
    draw_arrow(draw, (1200, 520), (1200, 440), color=(245, 158, 11), width=7)
    draw_badge(draw, (1200, 560), "3", font_badge, bg_color=(245, 158, 11), radius=32)
    
    # 4. Order Ticket Card
    box4 = (70, 500, 830, 1250)
    draw_callout_box(draw, box4, color=(249, 115, 22))
    draw_arrow(draw, (930, 750), (830, 750), color=(249, 115, 22), width=7)
    draw_badge(draw, (980, 750), "4", font_badge, bg_color=(249, 115, 22), radius=32)
    
    # 5. Order Action Buttons (กำลังจัดของ / เสิร์ฟแล้ว)
    box5 = (90, 1140, 810, 1235)
    draw_callout_box(draw, box5, color=(34, 197, 94))
    draw_arrow(draw, (930, 1185), (810, 1185), color=(34, 197, 94), width=7)
    draw_badge(draw, (980, 1185), "5", font_badge, bg_color=(34, 197, 94), radius=32)

    im.convert("RGB").save(r"C:\web\mookata-buffet\annotated_kitchen.png")
    print("annotated_kitchen.png saved.")

if __name__ == '__main__':
    annotate_cashier()
    annotate_qr_modal()
    annotate_customer()
    annotate_kitchen()
    print("All annotations completed successfully!")
