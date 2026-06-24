import fs from 'fs';
import { geoMercator, geoPath } from 'd3-geo';
const geojson = JSON.parse(fs.readFileSync('0-country.geojson', 'utf8'));
const projection = geoMercator().fitExtent([[20, 20], [780, 480]], geojson);
const pathData = geoPath().projection(projection)(geojson);

const commands = pathData.match(/[A-Z][^A-Z]*/gi);
let prevX, prevY;

for (let i = 0; i < commands.length; i++) {
  const cmd = commands[i];
  const type = cmd[0];
  const nums = cmd.substring(1).split(',').map(Number);
  if (type === 'M' || type === 'L') {
    const x = nums[0];
    const y = nums[1];
    if (prevX !== undefined) {
      const dx = Math.abs(x - prevX);
      const dy = Math.abs(y - prevY);
      if ((dx < 0.1 && dy > 20) || (dy < 0.1 && dx > 20)) {
        console.log(`Index ${i}: ${prevX},${prevY} to ${x},${y} (dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)})`);
      }
    }
    prevX = x;
    prevY = y;
  }
}
