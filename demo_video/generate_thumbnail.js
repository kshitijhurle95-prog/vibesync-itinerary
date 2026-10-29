import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_THUMBNAIL = 'C:\\Users\\HP\\Downloads\\VibeSync_Thumbnail.png';
const ARTIFACT_THUMBNAIL = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\346891d4-8085-4d11-8069-7f4e6ccad874\\VibeSync_Thumbnail.png';

async function generate() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 }); // 2x retina sharpness

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Space+Grotesk:wght@600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1280px;
      height: 720px;
      background: #090c15;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #ffffff;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 60px 80px;
    }

    /* Ambient glow circles */
    .glow-1 {
      position: absolute;
      width: 600px;
      height: 600px;
      left: -150px;
      top: -150px;
      background: radial-gradient(circle, rgba(47, 60, 240, 0.45) 0%, transparent 70%);
      filter: blur(60px);
      pointer-events: none;
    }
    .glow-2 {
      position: absolute;
      width: 550px;
      height: 550px;
      right: -100px;
      bottom: -100px;
      background: radial-gradient(circle, rgba(255, 79, 154, 0.4) 0%, transparent 70%);
      filter: blur(60px);
      pointer-events: none;
    }

    /* Grid overlay */
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    /* Left Content Column */
    .left-col {
      position: relative;
      z-index: 10;
      max-width: 620px;
    }

    .badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .pill-hackathon {
      background: linear-gradient(135deg, #ffd93d 0%, #ff9800 100%);
      color: #0b0e17;
      font-weight: 900;
      font-size: 13px;
      padding: 6px 16px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      box-shadow: 0 4px 15px rgba(255, 217, 61, 0.4);
    }

    .pill-tech {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      color: #e2e8f0;
      font-weight: 700;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 9999px;
      letter-spacing: 0.04em;
    }

    .brand-title {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .logo-circles {
      position: relative;
      width: 44px;
      height: 44px;
    }
    .c1 {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #2f3cf0;
      left: 0;
      top: 6px;
    }
    .c2 {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ff4f9a;
      right: 0;
      top: 6px;
      mix-blend-mode: screen;
    }

    .brand-name {
      font-size: 40px;
      font-weight: 900;
      letter-spacing: -0.03em;
      background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .main-headline {
      font-size: 56px;
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.04em;
      margin-bottom: 20px;
    }

    .headline-gradient {
      background: linear-gradient(135deg, #4f6bff 0%, #ff6aa9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: block;
    }

    .sub-hook {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 21px;
      line-height: 1.4;
      color: #94a3b8;
      font-weight: 600;
      max-width: 520px;
    }

    /* Right Preview Cards Column */
    .right-col {
      position: relative;
      z-index: 10;
      width: 460px;
    }

    .card-main {
      background: rgba(22, 28, 45, 0.85);
      border: 2px solid rgba(255, 255, 255, 0.16);
      border-radius: 28px;
      padding: 28px;
      box-shadow: 
        0 20px 50px rgba(0, 0, 0, 0.6),
        0 0 40px rgba(47, 60, 240, 0.25);
      backdrop-filter: blur(16px);
      transform: rotate(2deg) translateY(-10px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .tag-vibe {
      font-size: 12px;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .match-pill {
      background: rgba(47, 60, 240, 0.25);
      border: 1.5px solid #4f6bff;
      color: #7991ff;
      font-weight: 800;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .match-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4f6bff;
      box-shadow: 0 0 6px #4f6bff;
    }

    .card-vibe-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      color: #ffffff;
    }

    .keywords-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 20px;
    }
    .keyword {
      background: rgba(255, 255, 255, 0.08);
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
      color: #cbd5e1;
    }

    .stop-preview {
      background: rgba(11, 15, 25, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stop-time {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
    }
    .stop-details {
      margin-left: 14px;
      flex: 1;
    }
    .stop-name {
      font-size: 15px;
      font-weight: 800;
      color: #f1f5f9;
    }
    .stop-category {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }

    .affinity-meter {
      text-align: right;
    }
    .affinity-val {
      font-size: 14px;
      font-weight: 900;
      color: #4f6bff;
    }
    .affinity-bar {
      width: 70px;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 4px;
    }
    .affinity-fill {
      width: 82%;
      height: 100%;
      background: #4f6bff;
      border-radius: 3px;
    }

    /* Floating bottom-right chip */
    .chip-floating {
      position: absolute;
      bottom: -22px;
      left: 20px;
      background: #141833;
      border: 2px solid #ff4f9a;
      box-shadow: 0 10px 25px rgba(255, 79, 154, 0.35);
      border-radius: 9999px;
      padding: 10px 22px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 13px;
      color: #ffffff;
      transform: rotate(-3deg);
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>
  <div class="grid-bg"></div>

  <!-- Left Column -->
  <div class="left-col">
    <div class="badge-row">
      <span class="pill-hackathon">🏆 Qloo Hackathon</span>
      <span class="pill-tech">Groq LLaMA 3.3 + Qloo API</span>
    </div>

    <div class="brand-title">
      <div class="logo-circles">
        <div class="c1"></div>
        <div class="c2"></div>
      </div>
      <span class="brand-name">VibeSync</span>
    </div>

    <h1 class="main-headline">
      YOUR TASTE.
      <span class="headline-gradient">MAPPED ONTO A CITY.</span>
    </h1>

    <p class="sub-hook">
      Autonomous Cultural Travel Agent • Obscure Media Grounded in Physical Venues
    </p>
  </div>

  <!-- Right Column -->
  <div class="right-col">
    <div class="card-main">
      <div class="card-header">
        <span class="tag-vibe">Taste Profile • Tokyo</span>
        <div class="match-pill">
          <span class="match-dot"></span>
          82% Match
        </div>
      </div>

      <div class="card-vibe-title">Neon Noir Flux</div>

      <div class="keywords-row">
        <span class="keyword">cyberpunk</span>
        <span class="keyword">noir</span>
        <span class="keyword">glitch</span>
        <span class="keyword">underground</span>
        <span class="keyword">surreal</span>
      </div>

      <div class="stop-preview">
        <div>
          <div class="stop-time">10:00 AM</div>
        </div>
        <div class="stop-details">
          <div class="stop-name">BAPE STORE® HARAJUKU</div>
          <div class="stop-category">Fashion • Streetwear Destination</div>
        </div>
        <div class="affinity-meter">
          <div class="affinity-val">82%</div>
          <div class="affinity-bar"><div class="affinity-fill"></div></div>
        </div>
      </div>
    </div>

    <div class="chip-floating">
      <span>✨ 100% Taste-Matched Itinerary</span>
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: OUTPUT_THUMBNAIL, type: 'png' });
  await page.screenshot({ path: ARTIFACT_THUMBNAIL, type: 'png' });
  await browser.close();

  console.log(`Thumbnail generated successfully: ${OUTPUT_THUMBNAIL}`);
}

generate().catch(console.error);
