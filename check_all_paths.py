import re
import svgpathtools

with open('src/components/MapIcon.jsx', 'r') as f:
    svg = f.read()

paths = re.findall(r'<path[^>]*d="([^"]+)"', svg)

for i, p in enumerate(paths):
    try:
        path = svgpathtools.parse_path(p)
        xmin, xmax, ymin, ymax = path.bbox()
        print(f"Path {i}: len={len(p)}, X: {xmin:.1f}-{xmax:.1f}, Y: {ymin:.1f}-{ymax:.1f}")
    except Exception:
        pass
