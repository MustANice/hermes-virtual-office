const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function testLargeCloud() {
  const browser = await chromium.launch({ headless: true, executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 1040, height: 500 } });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #EDE8DF; display: flex; align-items: center; justify-content: center; height: 100vh; }
      </style>
    </head>
    <body>
      <canvas id="c" width="1024" height="480"></canvas>
      <script>
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');

        function drawSymmetricalCloud(ctx, x, y, width, height) {
          ctx.beginPath();
          const r = height * 0.44;
          ctx.arc(x + r * 0.85, y + height * 0.5, r * 0.72, Math.PI * 0.5, Math.PI * 1.5);
          ctx.arc(x + width * 0.22, y + r * 0.42, r * 0.65, Math.PI * 1.05, Math.PI * 1.85);
          ctx.arc(x + width * 0.42, y + r * 0.28, r * 0.78, Math.PI * 1.15, Math.PI * 1.95);
          ctx.arc(x + width * 0.62, y + r * 0.28, r * 0.78, Math.PI * 1.05, Math.PI * 1.85);
          ctx.arc(x + width * 0.80, y + r * 0.42, r * 0.65, Math.PI * 1.15, Math.PI * 1.95);
          ctx.arc(x + width - r * 0.85, y + height * 0.5, r * 0.72, -Math.PI * 0.5, Math.PI * 0.5);
          ctx.arc(x + width * 0.78, y + height - r * 0.42, r * 0.62, 0, Math.PI * 0.85);
          ctx.arc(x + width * 0.58, y + height - r * 0.32, r * 0.72, Math.PI * 0.15, Math.PI * 0.95);
          ctx.arc(x + width * 0.38, y + height - r * 0.32, r * 0.72, Math.PI * 0.05, Math.PI * 0.85);
          ctx.arc(x + width * 0.20, y + height - r * 0.42, r * 0.62, Math.PI * 0.15, Math.PI * 1.0);
          ctx.closePath();
        }

        const cx = 38, cy = 25, cw = 948, ch = 310;

        // Shadow & Body
        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 10;
        drawSymmetricalCloud(ctx, cx, cy, cw, ch);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Thick Vibrant Border
        drawSymmetricalCloud(ctx, cx, cy, cw, ch);
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Trail bubbles
        for (const bubble of [
          { x: 512, y: 375, radius: 22 },
          { x: 504, y: 425, radius: 15 },
          { x: 496, y: 460, radius: 9 },
        ]) {
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        const font = 'Inter, "Segoe UI", sans-serif';
        const left = 110;
        const right = 914;

        // Badge
        ctx.font = 'bold 32px ' + font;
        const badgeText = '⚡ SEDANG KERJA';
        const badgeWidth = Math.ceil(ctx.measureText(badgeText).width) + 48;
        const badgeX = right - badgeWidth;

        // Pill shape
        ctx.beginPath();
        const bx = badgeX, by = 90, bw = badgeWidth, bh = 64, br = 32;
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + bw - br, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
        ctx.lineTo(bx + bw, by + bh - br);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
        ctx.lineTo(bx + br, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
        ctx.lineTo(bx, by + br);
        ctx.quadraticCurveTo(bx, by, bx + br, by);
        ctx.closePath();
        ctx.fillStyle = '#078342';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, by + bh / 2);

        // Agent Name
        ctx.font = 'bold 44px ' + font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0F172A';
        ctx.fillText('⚙️ FORGE • BACKEND LAB', left, by + bh / 2);

        // Divider
        ctx.beginPath();
        ctx.moveTo(left, 185);
        ctx.lineTo(right, 185);
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Activity Text
        ctx.font = 'bold 36px ' + font;
        ctx.fillStyle = '#1E293B';
        ctx.fillText('⚡ Mengerjakan task: Production Build (Next.js 15)', left, 245);
      </script>
    </body>
    </html>
  `);

  await page.waitForTimeout(500);
  const buf = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/scripts/large_cloud_preview.png', buf);
  console.log("LARGE CLOUD PREVIEW SAVED");
  await browser.close();
}
testLargeCloud();
