import fs from 'fs';
import { geoMercator, geoPath } from 'd3-geo';

const geojson = JSON.parse(fs.readFileSync('0-country.geojson', 'utf8'));
const projection = geoMercator().fitExtent([[20, 20], [780, 480]], geojson);
const pathGen = geoPath().projection(projection);

const polys = geojson.features[0].geometry.coordinates;
polys.forEach((poly, i) => {
  const f = { type: 'Feature', geometry: { type: 'Polygon', coordinates: poly } };
  const d = pathGen(f);
  // Get bounds
  const bounds = pathGen.bounds(f);
  const w = bounds[1][0] - bounds[0][0];
  const h = bounds[1][1] - bounds[0][1];
  if (w > 200 || h > 200) {
    console.log(`Polygon ${i}: w=${w.toFixed(1)} h=${h.toFixed(1)}`);
  }
});
