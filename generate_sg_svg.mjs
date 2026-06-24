import fs from 'fs';
import { geoMercator, geoPath } from 'd3-geo';

const geojson = JSON.parse(fs.readFileSync('0-country.geojson', 'utf8'));

const projection = geoMercator().fitExtent([[20, 20], [780, 480]], geojson);
const pathGenerator = geoPath().projection(projection);

const pathData = pathGenerator(geojson);

const component = `import React from 'react';

export default function SingaporeMapIcon(props) {
  const { className, ...rest } = props;
  return (
    <svg {...rest} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <path className={className || "hm-map hm-map--sg"} d="${pathData}" />
    </svg>
  );
}
`;

fs.writeFileSync('src/components/SingaporeMapIcon.jsx', component);
console.log('Saved SingaporeMapIcon.jsx. Length:', pathData.length);
