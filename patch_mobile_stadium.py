import re

with open('src/index.css', 'r') as f:
    content = f.read()

content = content.replace('.hm-stadium { font-size: 13px; }', '.hm-stadium { font-size: 17px; }')

with open('src/index.css', 'w') as f:
    f.write(content)
