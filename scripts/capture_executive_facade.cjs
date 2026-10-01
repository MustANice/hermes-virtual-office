const http = require('http');
const fs = require('fs');

function getWebSocketDebuggerUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(t => t.type === 'page' && t.url.includes('3333'));
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else if (list.length > 0) {
            resolve(list[0].webSocketDebuggerUrl);
          } else {
            reject(new Error('No page target found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function capture() {
  const wsUrl = await getWebSocketDebuggerUrl();
  const WebSocket = require('ws');
  const ws = new WebSocket(wsUrl);

  let id = 1;
  const pending = new Map();

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(resolve => ws.on('open', resolve));

  // Focus on the Executive Suite storefront facade
  await send('Runtime.evaluate', {
    expression: `
      if (window.__robloxOffice) {
        window.__robloxOffice.cameraTarget.set(-20.5, 1.2, -10.5);
        window.__robloxOffice.cameraDistance = 24;
        window.__robloxOffice.cameraAngleX = 0.58;
        window.__robloxOffice.cameraAngleY = 0.08;
      }
    `
  });

  await new Promise(r => setTimeout(r, 1200));

  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-executive-facade.png', Buffer.from(screenshot.data, 'base64'));
  console.log('SUCCESS: screenshot-executive-facade.png written!');

  // Reset back to full campus view
  await send('Runtime.evaluate', {
    expression: `
      if (window.__robloxOffice) {
        window.__robloxOffice.focusRoom('all');
      }
    `
  });

  await new Promise(r => setTimeout(r, 800));

  const campusScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-latest-redesign-campus.png', Buffer.from(campusScreenshot.data, 'base64'));
  console.log('SUCCESS: screenshot-latest-redesign-campus.png refreshed!');

  ws.close();
  process.exit(0);
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
