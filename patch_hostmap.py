import re

with open('src/components/HostMap.jsx', 'r') as f:
    content = f.read()

# Replace the 4 clipped maps with a single map
old_geo = """        <div className="hm-geo" aria-hidden="true">
          <MapIcon className="hm-map hm-geo-ca" />
          <MapIcon className="hm-map hm-geo-us" />
          <MapIcon className="hm-map hm-geo-ak" />
          <MapIcon className="hm-map hm-geo-mx" />
        </div>

        {/* Transparent, clip-shaped hover targets — one per country region. */}
        <div className="hm-hit" aria-hidden="true">
          <span className="hm-hit-area hm-hit-ca" onMouseEnter={ccEnter('ca')} onMouseLeave={ccLeave} />
          <span className="hm-hit-area hm-hit-mx" onMouseEnter={ccEnter('mx')} onMouseLeave={ccLeave} />
          <span className="hm-hit-area hm-hit-us" onMouseEnter={ccEnter('us')} onMouseLeave={ccLeave} />
          <span className="hm-hit-area hm-hit-ak" onMouseEnter={ccEnter('us')} onMouseLeave={ccLeave} />
        </div>"""

new_geo = """        <div className="hm-geo" aria-hidden="true">
          <MapIcon className="hm-map" />
        </div>"""

content = content.replace(old_geo, new_geo)

with open('src/components/HostMap.jsx', 'w') as f:
    f.write(content)
