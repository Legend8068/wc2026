import re

with open('src/index.css', 'r') as f:
    content = f.read()

content = content.replace('max-width: 220px;', 'max-width: 280px;')
content = content.replace('gap: 3px;', 'gap: 6px;')
content = content.replace('padding: 11px 14px;', 'padding: 16px 20px;')

content = content.replace('font-size: 9px;', 'font-size: 11px;')
content = content.replace('padding: 2px 7px;', 'padding: 3px 9px;')
content = content.replace('margin-bottom: 2px;', 'margin-bottom: 4px;')

content = content.replace('font-size: 15px;', 'font-size: 20px;')
content = content.replace('font-size: 12px;', 'font-size: 14px;')

content = content.replace('margin-top: 4px;', 'margin-top: 6px;')
content = content.replace('font-size: 11px;', 'font-size: 13px;')

content = content.replace('width: 8px; height: 8px;', 'width: 10px; height: 10px;')

# For mobile styling rule at line 2676
content = content.replace('.hm-card { max-width: 168px; padding: 9px 11px; }', '.hm-card { max-width: 220px; padding: 12px 14px; }')

with open('src/index.css', 'w') as f:
    f.write(content)

