import fs from 'fs';
const data = fs.readFileSync('src/data.js', 'utf8');
const engine = fs.readFileSync('src/engine.js', 'utf8').replace("import D from './data';", data.replace('export default ', 'const D = '));
fs.writeFileSync('temp_engine.js', engine);
