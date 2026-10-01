const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function testUnionCloud() {
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

        // Cloud geometry defined as a series of overlapping puffy circles around a central pill
        const circles = [
          // Top row
          { x: 230, y: 130, r: 80 },
          { x: 380, y: 110, r: 92 },
          { x: 550, y: 100, r: 100 },
          { x: 720, y: 110, r: 92 },
          { x: 870, y: 130, r: 80 },
          // Right cap
          { x: 930, y: 220, r: 85 },
          // Bottom row
          { x: 860, y: 300, r: 82 },
          { x: 710, y: 315, r: 90 },
          { x: 550, y: 325, r: 95 },
          { x: 390, y: 315, r: 90 },
          { x: 240, y: 300, r: 82 },
          // Left cap
          { x: 170, y: 220, r: 85 },
        ];

        // Draw shadow on offscreen or with composite
        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 10;
        
        // 1. Fill central core
        ctx.beginPath();
        ctx.roundRect(220, 130, 660, 160, 40);
        circles.forEach(c => {
          ctx.moveTo(c.x + c.r, c.y);
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        });
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // 2. Crisp outer stroke: draw slightly larger circles behind or stroke individual outer arcs
        // Using an offscreen stroke pattern
        ctx.save();
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 5;
        // Stroke the outline cleanly
        circles.forEach((c, i) => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.stroke();
        });
        // Refill interior to eliminate internal circle lines!
        ctx.beginPath();
        ctx.roundRect(220, 130, 660, 160, 40);
        circles.forEach(c => {
          ctx.moveTo(c.x + c.r - 3, c.y);
          ctx.arc(c.x, c.y, c.r - 2.5, 0, Math.PI * 2);
        });
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Descending Trail Bubbles
        const tailX = 550;
        const tailY = 415;
        [
          { x: tailX, y: tailY + 10, r: 20 },
          { x: tailX - 6, y: tailY + 45, r: 13 },
          { x: tailX - 12, y: tailY + 70, r: 8 },
        ].forEach(b => {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 4;
          ctx.stroke();
        });

        // CONTENT
        const font = 'Inter, "Segoe UI", sans-serif';
        const left = 190;
        const right = 910;

        // Badge
        ctx.font = 'bold 24px ' + font;
        const badgeText = '⚡ SEDANG KERJA';
        const badgeWidth = Math.ceil(ctx.measureText(badgeText).width) + 38;
        const badgeX = right - badgeWidth;
        const badgeY = 145;
        const badgeH = 46;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeH, 23);
        ctx.fillStyle = '#059669';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeH / 2);

        // Agent Name
        ctx.font = 'bold 36px ' + font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0F172A';
        ctx.fillText('⚙️ FORGE • BACKEND LAB', left, badgeY + badgeH / 2);

        // Divider
        ctx.beginPath();
        ctx.moveTo(left, 215);
        ctx.lineTo(right, 215);
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Activity Text
        ctx.font = 'bold 30px ' + font;
        ctx.fillStyle = '#1E293B';
        ctx.fillText('⚡ Mengerjakan task: Production Build (Next.js 15.5)', left, 260);
      </script>
    </body>
    </html>
  `);

  await page.waitForTimeout(500);
  const buf = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/scripts/union_cloud_preview.png', buf);
  console.log("UNION CLOUD PREVIEW SAVED");
  await browser.close();
}
testUnionCloud();
