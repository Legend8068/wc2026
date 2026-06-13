import re

with open('src/components/HostMap.jsx', 'r') as f:
    content = f.read()

grad_def = """        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="hm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--cyan, #00f3ff)" />
              <stop offset="100%" stopColor="var(--blue, #3366ff)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="hm-geo" aria-hidden="true">"""

content = content.replace('<div className="hm-geo" aria-hidden="true">', grad_def)

with open('src/components/HostMap.jsx', 'w') as f:
    f.write(content)
