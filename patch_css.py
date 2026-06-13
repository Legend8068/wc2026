import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Remove the hm-geo and hm-hit CSS lines
content = re.sub(r'\n\.hm-geo-[a-z]{2} \{[^}]+\}', '', content)
content = re.sub(r'\n\.hm-wrap\.hm-hover-[a-z]{2} \.[a-z\.\-\s,]+ \{[^}]+\}', '', content)
content = re.sub(r'\n\.hm-hit(-area|-[a-z]{2})? \{[^}]+\}', '', content)
content = re.sub(r'\n\s*--clip-[a-z]{2}:[^;]+;', '', content)

with open('src/index.css', 'w') as f:
    f.write(content)
