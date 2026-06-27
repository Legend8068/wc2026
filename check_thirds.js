import fs from 'fs';
const data = fs.readFileSync('src/data.js', 'utf8');
let engine = fs.readFileSync('src/engine.js', 'utf8');
engine = engine.replace("import D from './data';", data.replace('export default {', 'const D = {'));
fs.writeFileSync('temp_engine.js', engine);
