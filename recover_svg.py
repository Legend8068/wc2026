import json

log_path = '/Users/ayush/.gemini/antigravity-ide/brain/90ed6469-c013-4b31-a5d7-c4ce80e441fc/.system_generated/logs/transcript.jsonl'

longest_path = ""

with open(log_path, 'r') as f:
    for line in f:
        # Search the raw line text for d="M179.252
        if 'M179.252' in line:
            # It's in this line!
            import re
            matches = re.findall(r'd="(M179\.252[^"]+)"', line)
            for m in matches:
                if len(m) > len(longest_path):
                    longest_path = m

if longest_path:
    with open('src/components/SingaporeMapIcon.jsx', 'w') as out:
        out.write('''import React from 'react';

export default function SingaporeMapIcon(props) {
  const { className, ...rest } = props;
  return (
    <svg {...rest} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <path className={className || "hm-map hm-map--sg"} d="''' + longest_path + '''" />
    </svg>
  );
}
''')
    print("RECOVERED ORIGINAL PATH! Length:", len(longest_path))
else:
    print("Still not found.")
