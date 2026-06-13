import re
with open('src/components/MapIcon.jsx', 'r') as f:
    svg = f.read()

paths = re.findall(r'<path[^>]*d="([^"]+)"', svg)
for i, p in enumerate(paths):
    if len(p) > 1000:
        subpaths = p.split('M')[1:]
        print(f"Path {i} has {len(subpaths)} subpaths.")
