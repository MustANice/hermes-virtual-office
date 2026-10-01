const fs = require('fs');
const playwrightPath = '/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright';
const chromePath = '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

console.log('Playwright exists:', fs.existsSync(playwrightPath));
console.log('Chrome exists:', fs.existsSync(chromePath));
