import fs from 'fs';
import { geoMercator, geoPath } from 'd3-geo';

const geojson = JSON.parse(fs.readFileSync('0-country.geojson', 'utf8'));
const projection = geoMercator().fitExtent([[20, 20], [780, 480]], geojson);
const pathData = geoPath().projection(projection)(geojson);

const commands = pathData.match(/[A-Z][^A-Z]*/gi);

// We want to delete commands from index 2060 to 2074.
// Let's verify they match the exact coordinates!
if (commands[2059].includes('99.771,329.43') && commands[2075].includes('119.757,387.28')) {
  commands.splice(2060, 15); // Delete 15 commands (from 2060 to 2074)
  console.log("Successfully deleted the zigzag maritime bounding box!");
} else {
  console.log("Error: Expected coordinates not found at the indices! Finding dynamically...");
  // Dynamic find
  let startIdx = -1;
  let endIdx = -1;
  for (let i=0; i<commands.length; i++) {
    if (commands[i].includes('65.879,329.432')) startIdx = i; // First segment of the box
    if (commands[i].includes('61.444,387.284')) endIdx = i; // Last segment of the box
  }
  if (startIdx !== -1 && endIdx !== -1) {
    commands.splice(startIdx, endIdx - startIdx + 1);
    console.log(`Dynamically deleted from ${startIdx} to ${endIdx}`);
  }
}

const finalPath = commands.join('');

const component = `import React from 'react';

export default function SingaporeMapIcon(props) {
  const { className, ...rest } = props;
  return (
    <svg {...rest} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <path className={className || "hm-map hm-map--sg"} d="${finalPath}" />
    </svg>
  );
}
`;

fs.writeFileSync('src/components/SingaporeMapIcon.jsx', component);
console.log('Saved clean SingaporeMapIcon.jsx. Length:', finalPath.length);
