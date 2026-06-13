import re
import svgpathtools

with open('src/components/MapIcon.jsx', 'r') as f:
    svg = f.read()

paths = re.findall(r'<path[^>]*d="([^"]+)"', svg)
p27 = paths[27]

subpath_strings = ['M' + s for s in p27.split('M')[1:]]
for i, sp in enumerate(subpath_strings):
    try:
        path = svgpathtools.parse_path(sp)
        xmin, xmax, ymin, ymax = path.bbox()
        print(f"Subpath {i}: len={len(sp)}, X: {xmin:.1f}-{xmax:.1f}, Y: {ymin:.1f}-{ymax:.1f}")
    except Exception:
        pass
