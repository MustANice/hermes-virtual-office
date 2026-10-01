const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function testLargeCloud() {
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

        function drawFlawlessCloud(ctx, x, y, w, h) {
          ctx.beginPath();
          // Base pill with outward cloud lobes
          const r = 50;
          ctx.moveTo(x + r, y);
          // Top lobes
          ctx.arc(x + w * 0.22, y - 18, 55, Math.PI * 1.05, Math.PI * 1.95);
          ctx.arc(x + w * 0.44, y - 28, 68, Math.PI * 1.10, Math.PI * 1.90);
          ctx.arc(x + w * 0.66, y - 28, 68, Math.PI * 1.10, Math.PI * 1.90);
          ctx.arc(x + w * 0.82, y - 18, 55, Math.PI * 1.05, Math.PI * 1.95);
          
          // Right lobe
          ctx.arc(x + w + 12, y + h * 0.5, 62, -Math.PI * 0.45, Math.PI * 0.45);
          
          // Bottom lobes
          ctx.arc(x + w * 0.80, y + h + 15, 52, 0, Math.PI * 0.90);
          ctx.arc(x + w * 0.62, y + h + 22, 60, Math.PI * 0.15, Math.PI * 0.88);
          ctx.arc(x + w * 0.38, y + h + 22, 60, Math.PI * 0.12, Math.PI * 0.85);
          ctx.arc(x + w * 0.20, y + h + 15, 52, Math.PI * 0.10, Math.PI * 0.95);
          
          // Left lobe
          ctx.arc(x - 12, y + h * 0.5, 62, Math.PI * 0.55, Math.PI * 1.45);
          ctx.closePath();
        }

        const cx = 80, cy = 65, cw = 940, ch = 240;

        // Shadow & Body
        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 12;
        drawFlawlessCloud(ctx, cx, cy, cw, ch);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Thick Vibrant Border
        drawFlawlessCloud(ctx, cx, cy, cw, ch);
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 5.5;
        ctx.stroke();

        // Descending Trail Bubbles
        const tailX = cx + cw * 0.5;
        const tailY = cy + ch + 32;
        [
          { x: tailX, y: tailY + 12, r: 24 },
          { x: tailX - 6, y: tailY + 54, r: 16 },
          { x: tailX - 12, y: tailY + 86, r: 9 },
        ].forEach(b => {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 4;
          ctx.stroke();
        });

        const font = 'Inter, "Segoe UI", sans-serif';
        const left = 120;
        const right = 980;

        // 1. Status Badge on Right
        ctx.font = 'bold 24px ' + font;
        const badgeText = '⚡ SEDANG KERJA';
        const badgeWidth = Math.ceil(ctx.measureText(badgeText).width) + 40;
        const badgeX = right - badgeWidth;
        const badgeY = cy + 30;
        const badgeH = 50;
        const badgeR = 25;

        // Pill shape for badge
        ctx.beginPath();
        ctx.moveTo(badgeX + badgeR, badgeY);
        ctx.lineTo(badgeX + badgeWidth - badgeR, badgeY);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeR);
        ctx.lineTo(badgeX + badgeWidth, badgeY + badgeH - badgeR);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeH, badgeX + badgeWidth - badgeR, badgeY + badgeH);
        ctx.lineTo(badgeX + badgeR, badgeY + badgeH);
        ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - badgeR);
        ctx.lineTo(badgeX, badgeY + badgeR);
        ctx.quadraticCurveTo(badgeX, badgeY, badgeX + badgeR, badgeY);
        ctx.closePath();
        ctx.fillStyle = '#059669';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeH / 2);

        // 2. Agent Name on Left
        ctx.font = 'bold 36px ' + font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0F172A';
        ctx.fillText('⚙️ FORGE • BACKEND LAB', left, badgeY + badgeH / 2);

        // 3. Crisp Divider Line
        ctx.beginPath();
        ctx.moveTo(left, cy + 115);
        ctx.lineTo(right, cy + 115);
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 4. Activity Explanation (Large, bold, high-contrast)
        ctx.font = 'bold 30px ' + font;
        ctx.fillStyle = '#1E293B';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡ Mengerjakan task: Production Build (Next.js 15.5)', left, cy + 175);
      </script>
    </body>
    </html>
  `);

  await page.waitForTimeout(500);
  const buf = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/scripts/flawless_cloud_preview.png', buf);
  console.log("FLAWLESS CLOUD PREVIEW SAVED");
  await browser.close();
}
testLargeCloud();
