const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function testMegaCloud() {
  const browser = await chromium.launch({ headless: true, executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 600 } });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #EDE8DF; display: flex; align-items: center; justify-content: center; height: 100vh; }
      </style>
    </head>
    <body>
      <canvas id="c" width="1100" height="500"></canvas>
      <script>
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');

        const circles = [
          // Top row
          { x: 230, y: 130, r: 85 },
          { x: 380, y: 105, r: 95 },
          { x: 550, y: 95, r: 105 },
          { x: 720, y: 105, r: 95 },
          { x: 870, y: 130, r: 85 },
          // Right cap
          { x: 940, y: 220, r: 90 },
          // Bottom row
          { x: 870, y: 310, r: 85 },
          { x: 710, y: 330, r: 95 },
          { x: 550, y: 340, r: 100 },
          { x: 390, y: 330, r: 95 },
          { x: 230, y: 310, r: 85 },
          // Left cap
          { x: 160, y: 220, r: 90 },
        ];

        // Draw shadow & body
        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
        ctx.shadowBlur = 28;
        ctx.shadowOffsetY = 12;
        ctx.beginPath();
        ctx.roundRect(210, 120, 680, 180, 40);
        circles.forEach(c => {
          ctx.moveTo(c.x + c.r, c.y);
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        });
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Stroke
        ctx.save();
        ctx.strokeStyle = '#0284C7';
        ctx.lineWidth = 6.5;
        circles.forEach(c => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.stroke();
        });
        // Refill interior
        ctx.beginPath();
        ctx.roundRect(210, 120, 680, 180, 40);
        circles.forEach(c => {
          ctx.moveTo(c.x + c.r - 4, c.y);
          ctx.arc(c.x, c.y, c.r - 3, 0, Math.PI * 2);
        });
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Trail bubbles
        const tailX = 550;
        const tailY = 430;
        [
          { x: tailX, y: tailY + 10, r: 24 },
          { x: tailX - 6, y: tailY + 48, r: 16 },
          { x: tailX - 12, y: tailY + 76, r: 10 },
        ].forEach(b => {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#0284C7';
          ctx.lineWidth = 4.5;
          ctx.stroke();
        });

        // CONTENT - HUGE, BOLD, HIGH CONTRAST
        const font = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const left = 160;
        const right = 940;

        // 1. Status Badge
        ctx.font = '900 32px ' + font;
        const badgeText = '☕ SANTAI / IDLE';
        const badgeWidth = Math.ceil(ctx.measureText(badgeText).width) + 48;
        const badgeX = right - badgeWidth;
        const badgeY = 138;
        const badgeH = 58;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeH, 29);
        ctx.fillStyle = '#D97706';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeH / 2 + 1);

        // 2. Agent Name (HUGE 46px BOLD)
        ctx.font = '900 48px ' + font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0F172A';
        ctx.fillText('👑 ORION', left, badgeY + badgeH / 2);

        // 3. Divider Line
        ctx.beginPath();
        ctx.moveTo(left, 222);
        ctx.lineTo(right, 222);
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // 4. Activity Description (HUGE 42px BOLD)
        ctx.font = '800 40px ' + font;
        ctx.fillStyle = '#1E293B';
        ctx.fillText('☕ Standby • Memantau sistem di meja kerja', left, 275);
      </script>
    </body>
    </html>
  `);

  await page.waitForTimeout(500);
  const buf = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/scripts/mega_cloud_preview.png', buf);
  console.log("MEGA CLOUD PREVIEW SAVED");
  await browser.close();
}
testMegaCloud();
