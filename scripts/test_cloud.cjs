const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function testCloudRender() {
  const browser = await chromium.launch({ headless: true, executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 520, height: 320 } });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #EDE8DF; display: flex; align-items: center; justify-content: center; height: 100vh; }
      </style>
    </head>
    <body>
      <canvas id="c" width="460" height="200"></canvas>
      <script>
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');

        function drawSymmetricalCloud(ctx, x, y, w, h) {
          ctx.beginPath();
          const r = h * 0.45;
          ctx.arc(x + r * 0.85, y + h * 0.5, r * 0.72, Math.PI * 0.5, Math.PI * 1.5);
          ctx.arc(x + w * 0.22, y + r * 0.42, r * 0.65, Math.PI * 1.05, Math.PI * 1.85);
          ctx.arc(x + w * 0.42, y + r * 0.28, r * 0.78, Math.PI * 1.15, Math.PI * 1.95);
          ctx.arc(x + w * 0.62, y + r * 0.28, r * 0.78, Math.PI * 1.05, Math.PI * 1.85);
          ctx.arc(x + w * 0.80, y + r * 0.42, r * 0.65, Math.PI * 1.15, Math.PI * 1.95);
          ctx.arc(x + w - r * 0.85, y + h * 0.5, r * 0.72, -Math.PI * 0.5, Math.PI * 0.5);
          ctx.arc(x + w * 0.78, y + h - r * 0.42, r * 0.62, 0, Math.PI * 0.85);
          ctx.arc(x + w * 0.58, y + h - r * 0.32, r * 0.72, Math.PI * 0.15, Math.PI * 0.95);
          ctx.arc(x + w * 0.38, y + h - r * 0.32, r * 0.72, Math.PI * 0.05, Math.PI * 0.85);
          ctx.arc(x + w * 0.20, y + h - r * 0.42, r * 0.62, Math.PI * 0.15, Math.PI * 1.0);
          ctx.closePath();
        }

        const cx = 30, cy = 18, cw = 400, ch = 100;

        // Shadow & Body
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.16)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 5;
        drawSymmetricalCloud(ctx, cx, cy, cw, ch);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Stroke
        ctx.save();
        drawSymmetricalCloud(ctx, cx, cy, cw, ch);
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Trail bubbles
        const tailX = cx + cw * 0.5;
        const tailY = cy + ch + 2;
        [
          { x: tailX, y: tailY + 8, r: 6.5 },
          { x: tailX - 4, y: tailY + 22, r: 4.5 },
          { x: tailX - 7, y: tailY + 34, r: 2.8 }
        ].forEach(b => {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        ctx.restore();

        // Header
        ctx.beginPath();
        ctx.arc(80, 52, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#22C55E';
        ctx.fill();

        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'left';
        ctx.fillText('FORGE • BACKEND LAB', 96, 57);

        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = '#059669';
        ctx.fillText('⚡ WORKING', 305, 57);

        // Activity Text
        ctx.font = '500 13px Inter, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText('📋 Task: Production Build & Service Reload (60fps)', 80, 84);
      </script>
    </body>
    </html>
  `);

  await page.waitForTimeout(500);
  const buf = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/scripts/cloud_symmetrical.png', buf);
  console.log("SYMMETRICAL CLOUD SAVED");
  await browser.close();
}
testCloudRender();
