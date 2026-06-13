const fs = require('fs');
let svg = fs.readFileSync('src/assets/WC_map.svg', 'utf8');

// Replace standard SVG attributes with React camelCase
svg = svg.replace(/class="cls-1"/g, 'fill="currentColor"');
svg = svg.replace(/data-name/g, 'dataName');
svg = svg.replace(/viewBox/g, 'viewBox');
svg = svg.replace(/<style>[\s\S]*?<\/style>/g, '');

// The inverted mask path is the 4th path in the original file
// We can just remove the specific path that has 'h1596v1536H0V0'
svg = svg.replace(/<path[^>]*h1596v1536H0V0[^>]*>/g, '');

const component = `
import React from 'react';

export default function MapIcon(props) {
  return (
    ${svg.replace(/<\?xml.*\?>/g, '').replace('<svg ', '<svg {...props} ')}
  );
}
`;

fs.writeFileSync('src/components/MapIcon.jsx', component);
console.log('Component created.');
