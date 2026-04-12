#!/usr/bin/env python3
import base64, struct, zlib

def create_png(size, color_bg, color_icon):
    """Create a simple PNG icon programmatically"""
    import struct, zlib
    
    w = h = size
    # Create pixel data - green background with calendar emoji approximation
    pixels = []
    for y in range(h):
        row = []
        for x in range(w):
            cx, cy = x - w//2, y - h//2
            r = (w * 0.45) ** 2
            # rounded square background
            margin = w * 0.12
            in_bg = (margin < x < w-margin and margin < y < h-margin)
            # inner rounding
            cr = w * 0.15
            in_corner = False
            corners = [(margin+cr, margin+cr), (w-margin-cr, margin+cr), 
                       (margin+cr, h-margin-cr), (w-margin-cr, h-margin-cr)]
            for (cx2,cy2) in corners:
                dx,dy = x-cx2, y-cy2
                if (x < cx2 and y < cy2) or (x > w-margin-cr+margin and y < cy2) or \
                   (x < cx2 and y > h-margin-cr+margin) or (x > w-margin-cr+margin and y > h-margin-cr+margin):
                    if dx*dx + dy*dy > cr*cr:
                        in_corner = True
            
            in_shape = in_bg and not in_corner
            
            # Calendar grid lines
            gx = (x - margin*1.2) / (w - margin*2.4)
            gy = (y - margin*1.5) / (h - margin*2.0)
            
            is_line = False
            if in_shape:
                # header band
                if margin < y < margin + h*0.18:
                    is_line = True
                # vertical dividers
                for col in [0.33, 0.66]:
                    if abs(gx - col) < 0.04 and gy > 0.2:
                        is_line = True
                # horizontal dividers
                for row_f in [0.55]:
                    if abs(gy - row_f) < 0.04 and gx > 0.0:
                        is_line = True
            
            if in_shape:
                if is_line:
                    row.extend([255, 255, 255, 220])  # white lines
                else:
                    row.extend(color_bg)  # bg color
            else:
                row.extend([0, 0, 0, 0])  # transparent
        pixels.append(bytes(row))
    
    def make_chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    
    png = b'\x89PNG\r\n\x1a\n'
    png += make_chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    
    raw = b''
    for row in pixels:
        raw += b'\x00' + row
    
    png += make_chunk(b'IDAT', zlib.compress(raw, 9))
    png += make_chunk(b'IEND', b'')
    return png

# Green: #1D9E75 = (29, 158, 117)
green = [29, 158, 117, 255]

for size in [192, 512]:
    png_data = create_png(size, green, [255,255,255,255])
    with open(f'/home/claude/agenda/icon-{size}.png', 'wb') as f:
        f.write(png_data)
    print(f'Created icon-{size}.png ({len(png_data)} bytes)')

print('Icons created successfully')
