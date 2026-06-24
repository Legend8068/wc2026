import fs from 'fs';
import { createServer } from 'vite';

async function test() {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const App = (await vite.ssrLoadModule('/src/App.jsx')).default;
    const { renderToString } = await vite.ssrLoadModule('react-dom/server');
    const React = await vite.ssrLoadModule('react');

    const html = renderToString(React.createElement(App));
    console.log("RENDER SUCCESS, length:", html.length);
  } catch (e) {
    console.error("RENDER ERROR:", e);
  } finally {
    vite.close();
  }
}
test();
