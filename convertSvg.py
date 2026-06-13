import re

with open('src/assets/WC_map.svg', 'r') as f:
    svg = f.read()

# Replace class="cls-1" with fill="currentColor"
svg = re.sub(r'class="cls-1"', 'fill="currentColor"', svg)
# Remove the style block
svg = re.sub(r'<style>.*?</style>', '', svg, flags=re.DOTALL)
# Remove data-name and change to dataName
svg = re.sub(r'data-name', 'dataName', svg)
# Remove xml header
svg = re.sub(r'<\?xml.*?\?>\n?', '', svg)
# Make svg tag accept props
svg = re.sub(r'<svg ', '<svg {...props} ', svg)

# Find and remove the giant background path
# We look for a path that has "h1596v1536H0V0"
svg = re.sub(r'<path[^>]*h1596v1536H0V0[^>]*>', '', svg)

# Also remove the fill="#fff" we added earlier from the root tag
svg = re.sub(r'fill="#fff"', '', svg)

component = f"""import React from 'react';

export default function MapIcon(props) {{
  return (
    {svg.strip()}
  );
}}
"""

with open('src/components/MapIcon.jsx', 'w') as f:
    f.write(component)

print("Component created.")
