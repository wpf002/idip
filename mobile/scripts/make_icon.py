"""Generate the IDIP app icon: a white shield + checkmark on an electric-blue
gradient. Renders a 1024x1024 master (supersampled for clean edges)."""
import math
from PIL import Image, ImageDraw

S = 1024
SS = 4  # supersample factor
W = S * SS

TOP = (0x5B, 0x8C, 0xFF)     # electric blue
BOT = (0x36, 0x3F, 0xC4)     # indigo
WHITE = (0xFF, 0xFF, 0xFF)
CHECK = (0x33, 0x52, 0xD6)   # deep blue for the check on white


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(img):
    px = img.load()
    for y in range(W):
        c = lerp(TOP, BOT, y / (W - 1))
        for x in range(W):
            px[x, y] = c


def quarter_arc(cx, cy, r, start_deg, end_deg, n=24):
    pts = []
    for i in range(n + 1):
        a = math.radians(start_deg + (end_deg - start_deg) * i / n)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def shield_polygon():
    cx = W / 2
    half = W * 0.255
    top = W * 0.235
    side_h = W * 0.30          # straight side length
    bottom = W * 0.80          # bottom point y
    r = W * 0.075              # top corner radius
    pts = []
    # top-left corner arc (from left side up to top edge)
    pts += quarter_arc(cx - half + r, top + r, r, 180, 270)
    # top-right corner arc
    pts += quarter_arc(cx + half - r, top + r, r, 270, 360)
    # right side down
    pts.append((cx + half, top + side_h))
    # bottom point
    pts.append((cx, bottom))
    # left side up
    pts.append((cx - half, top + side_h))
    return pts


def draw_check(draw):
    cx = W / 2
    p1 = (cx - W * 0.105, W * 0.45)
    p2 = (cx - W * 0.025, W * 0.535)
    p3 = (cx + W * 0.135, W * 0.355)
    width = int(W * 0.055)
    draw.line([p1, p2, p3], fill=CHECK, width=width, joint='curve')
    for p in (p1, p2, p3):
        rr = width / 2
        draw.ellipse([p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr], fill=CHECK)


def main():
    img = Image.new('RGB', (W, W))
    gradient(img)
    draw = ImageDraw.Draw(img)
    draw.polygon(shield_polygon(), fill=WHITE)
    draw_check(draw)
    img = img.resize((S, S), Image.LANCZOS)
    out = __import__('os').path.join(
        __import__('os').path.dirname(__file__), '..', 'ios', 'IDIP',
        'Images.xcassets', 'AppIcon.appiconset', 'icon-1024.png')
    img.save(out)
    print('wrote', out)


if __name__ == '__main__':
    main()
