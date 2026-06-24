import fs from 'fs';
let content = fs.readFileSync('src/components/SingaporeMapIcon.jsx', 'utf8');

// Find the path string
const pathMatch = content.match(/d="(M[^"]+)"/);
if (!pathMatch) {
  console.log('Path not found!');
  process.exit(1);
}
const pathData = pathMatch[1];

const newContent = `import React from 'react';

export default function SingaporeMapIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <path d="${pathData}" />
    </svg>
  );
}
`;

fs.writeFileSync('src/components/SingaporeMapIcon.jsx', newContent);
console.log('Fixed SVG class! New length:', newContent.length);
