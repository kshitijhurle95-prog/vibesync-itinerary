import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORK_DIR = 'C:\\Users\\HP\\Downloads\\vibesync-itinerary\\demo_video';
const TIMINGS_FILE = path.join(WORK_DIR, 'scene_timings.json');
const OUTPUT_VIDEO = path.join(WORK_DIR, 'raw_screencast.mp4');

const timings = JSON.parse(fs.readFileSync(TIMINGS_FILE, 'utf-8'));
const TOTAL_DURATION = timings.total_duration; // ~138.42s
const FPS = 30;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log(`Starting screencast recording. Total expected duration: ${TOTAL_DURATION}s`);

  // Start FFmpeg process to receive mjpeg frames from CDP
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    OUTPUT_VIDEO
  ];

  const ffmpegProc = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  ffmpegProc.on('error', (err) => console.error('FFmpeg process error:', err));

  // Launch Chrome
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true, // running headless with Chrome DevTools Protocol
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    },
    args: [
      '--window-size=1920,1080',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--hide-scrollbars'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Navigate to local VibeSync app
  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Inject virtual cursor and scene banner
  await page.evaluate(() => {
    // Custom sleek scrollbar
    const style = document.createElement('style');
    style.innerHTML = `
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(86, 92, 125, 0.4); border-radius: 4px; }
      #virtual-cursor {
        position: fixed;
        top: 0;
        left: 0;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #2f3cf0;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 16px rgba(47, 60, 240, 0.8), 0 3px 8px rgba(0,0,0,0.4);
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, -50%);
        transition: transform 0.05s linear;
      }
      #cursor-ripple {
        position: fixed;
        top: 0;
        left: 0;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2.5px solid #ff4f9a;
        pointer-events: none;
        z-index: 999998;
        transform: translate(-50%, -50%) scale(0.2);
        opacity: 0;
        transition: transform 0.35s ease-out, opacity 0.35s ease-out;
      }
      #scene-indicator {
        position: fixed;
        bottom: 28px;
        right: 32px;
        background: rgba(20, 24, 51, 0.88);
        backdrop-filter: blur(10px);
        color: #ffffff;
        padding: 9px 20px;
        border-radius: 9999px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.03em;
        border: 1px solid rgba(255, 255, 255, 0.22);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        pointer-events: none;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #scene-indicator::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #2f3cf0;
        box-shadow: 0 0 8px #2f3cf0;
      }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.id = 'virtual-cursor';
    document.body.appendChild(cursor);

    const ripple = document.createElement('div');
    ripple.id = 'cursor-ripple';
    document.body.appendChild(ripple);

    const indicator = document.createElement('div');
    indicator.id = 'scene-indicator';
    indicator.innerText = '1/7 • Overview & Architecture';
    document.body.appendChild(indicator);

    window.__cursorX = 960;
    window.__cursorY = 540;

    window.updateCursor = (x, y) => {
      window.__cursorX = x;
      window.__cursorY = y;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    };

    window.triggerClick = (x, y) => {
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.transform = 'translate(-50%, -50%) scale(0.2)';
      ripple.style.opacity = '1';
      requestAnimationFrame(() => {
        ripple.style.transform = 'translate(-50%, -50%) scale(1.6)';
        ripple.style.opacity = '0';
      });
    };

    window.updateIndicator = (text) => {
      indicator.innerText = text;
    };
  });

  // Helper functions for mouse motion
  async function moveMouseSmooth(targetX, targetY, durationMs = 600) {
    const steps = Math.max(10, Math.floor(durationMs / 20));
    const startPos = await page.evaluate(() => ({ x: window.__cursorX, y: window.__cursorY }));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // ease-in-out quadratic
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const curX = startPos.x + (targetX - startPos.x) * ease;
      const curY = startPos.y + (targetY - startPos.y) * ease;
      await page.evaluate((x, y) => window.updateCursor(x, y), curX, curY);
      await sleep(durationMs / steps);
    }
  }

  async function clickAt(x, y) {
    await moveMouseSmooth(x, y, 400);
    await page.evaluate((cx, cy) => window.triggerClick(cx, cy), x, y);
    await page.mouse.click(x, y);
    await sleep(250);
  }

  async function smoothScrollTo(targetY, durationMs = 800) {
    const steps = Math.max(15, Math.floor(durationMs / 25));
    const startY = await page.evaluate(() => window.scrollY);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const curY = startY + (targetY - startY) * ease;
      await page.evaluate((y) => window.scrollTo(0, y), curY);
      await sleep(durationMs / steps);
    }
  }

  // Create CDP session and start screencast
  const client = await page.target().createCDPSession();
  let frameCount = 0;
  const startTime = Date.now();

  client.on('Page.screencastFrame', async (params) => {
    try {
      const buffer = Buffer.from(params.data, 'base64');
      if (ffmpegProc.stdin.writable) {
        ffmpegProc.stdin.write(buffer);
        frameCount++;
      }
      await client.send('Page.screencastFrameAck', { sessionId: params.sessionId });
    } catch (e) {
      // ignore frame ack errors
    }
  });

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 1
  });

  console.log('Screencast recording started!');

  // ==========================================
  // SCENE 1: Problem & Vision (0.0s - 22.9s)
  // ==========================================
  console.log('Executing Scene 1: Problem & Vision...');
  await page.evaluate(() => window.updateIndicator('1/7 • Overview & Architecture'));
  await sleep(800);
  // Hover logo
  await moveMouseSmooth(410, 36, 700);
  await sleep(1500);
  // Hover main title
  await moveMouseSmooth(520, 220, 900);
  await sleep(2000);
  // Hover 3 value proposition pills
  await moveMouseSmooth(430, 420, 700);
  await sleep(1800);
  await moveMouseSmooth(570, 420, 600);
  await sleep(1800);
  await moveMouseSmooth(720, 420, 600);
  await sleep(2200);
  // Hover over the brutalist form card
  await moveMouseSmooth(1200, 320, 800);

  // Sync wait until Scene 2 start (22.9s)
  const scene2Start = timings.scenes[1].start * 1000;
  while (Date.now() - startTime < scene2Start) {
    await sleep(50);
  }

  // ==========================================
  // SCENE 2: Interactive Input & Multi-Day Planning (22.9s - 46.05s)
  // ==========================================
  console.log('Executing Scene 2: Interactive Input & Multi-Day Planning...');
  await page.evaluate(() => window.updateIndicator('2/7 • Inputs & Dark Mode'));
  
  // 1. Move to Theme Toggle button and click to show Dark Mode
  const themeBtnBox = await page.evaluate(() => {
    const el = document.getElementById('theme-toggle-btn');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (themeBtnBox) {
    await clickAt(themeBtnBox.x, themeBtnBox.y);
    console.log('Dark mode toggled!');
    await sleep(2000);
  }

  // 2. Click "Try an example"
  const tryExampleBox = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.innerText.includes('Try an example'));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (tryExampleBox) {
    await clickAt(tryExampleBox.x, tryExampleBox.y);
    console.log('Clicked "Try an example" button!');
    await sleep(1800);
  }

  // 3. Hover over the generated tags
  await moveMouseSmooth(1150, 240, 700);
  await sleep(1500);

  // 4. Click Days buttons: click 3, then click 2
  const dayBoxes = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter((b) => ['1', '2', '3'].includes(b.innerText.trim()));
    return btns.map((b) => {
      const r = b.getBoundingClientRect();
      return { text: b.innerText.trim(), x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  });
  const day3 = dayBoxes.find((d) => d.text === '3');
  const day2 = dayBoxes.find((d) => d.text === '2');
  if (day3) {
    await clickAt(day3.x, day3.y);
    await sleep(800);
  }
  if (day2) {
    await clickAt(day2.x, day2.y);
    await sleep(1000);
  }

  // Hover over "Build my weekend" button
  const submitBtnBox = await page.evaluate(() => {
    const b = document.querySelector('button[type="submit"]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (submitBtnBox) {
    await moveMouseSmooth(submitBtnBox.x, submitBtnBox.y, 600);
  }

  // Sync wait until Scene 3 start (46.05s)
  const scene3Start = timings.scenes[2].start * 1000;
  while (Date.now() - startTime < scene3Start) {
    await sleep(50);
  }

  // ==========================================
  // SCENE 3: Autonomous Agent Pipeline in Action (46.05s - 64.22s)
  // ==========================================
  console.log('Executing Scene 3: Autonomous Agent Pipeline in Action...');
  await page.evaluate(() => window.updateIndicator('3/7 • Multi-Stage Agent Pipeline'));

  // Ensure loading screen stays visible through Scene 3 duration (~16 seconds)
  await page.evaluate(() => {
    window.__MIN_LOADING_MS = 16000;
  });

  if (submitBtnBox) {
    await clickAt(submitBtnBox.x, submitBtnBox.y);
    console.log('Submitted itinerary generation form!');
  }

  await sleep(1000);
  // Smooth gentle cursor movement around the animated loading status
  await moveMouseSmooth(960, 420, 1000);
  await sleep(2500);
  await moveMouseSmooth(960, 520, 1000);
  await sleep(3500);
  await moveMouseSmooth(920, 560, 800);
  await sleep(3500);

  // Sync wait until Scene 4 start (64.22s)
  const scene4Start = timings.scenes[3].start * 1000;
  while (Date.now() - startTime < scene4Start) {
    await sleep(50);
  }

  // ==========================================
  // SCENE 4: Aesthetic Profile & Qloo Taste Graph Grounding (64.22s - 83.29s)
  // ==========================================
  console.log('Executing Scene 4: Aesthetic Profile & Qloo Taste Graph...');
  await page.evaluate(() => window.updateIndicator('4/7 • Aesthetic Profile & Taste Graph'));

  // Make sure result rendered
  await page.waitForSelector('h2', { timeout: 10000 });
  await sleep(1000);

  // Hover over Vibe Title
  await moveMouseSmooth(550, 180, 800);
  await sleep(2500);

  // Hover over vibe keywords
  await moveMouseSmooth(520, 310, 800);
  await sleep(2500);

  // Hover over Qloo taste graph badge on right
  await moveMouseSmooth(1300, 240, 800);
  await sleep(2500);

  // Toggle Theme button to demonstrate light mode on the rich dashboard
  const themeBtnBox2 = await page.evaluate(() => {
    const el = document.getElementById('theme-toggle-btn');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (themeBtnBox2) {
    await clickAt(themeBtnBox2.x, themeBtnBox2.y);
    console.log('Toggled theme on dashboard!');
    await sleep(2000);
  }

  // Sync wait until Scene 5 start (83.29s)
  const scene5Start = timings.scenes[4].start * 1000;
  while (Date.now() - startTime < scene5Start) {
    await sleep(50);
  }

  // ==========================================
  // SCENE 5: Hour-by-Hour Itinerary & Taste-Match Precision (83.29s - 102.21s)
  // ==========================================
  console.log('Executing Scene 5: Hour-by-Hour Itinerary & Taste-Match Precision...');
  await page.evaluate(() => window.updateIndicator('5/7 • Scheduled Timeline & Qloo Affinity'));

  // Smooth scroll down to timeline stops
  await smoothScrollTo(480, 1000);
  await sleep(800);

  // Hover over first stop time & title
  await moveMouseSmooth(600, 480, 700);
  await sleep(2200);

  // Hover over Qloo affinity bar
  await moveMouseSmooth(650, 680, 700);
  await sleep(2400);

  // Hover over "Why it fits your taste" callout box
  await moveMouseSmooth(600, 600, 700);
  await sleep(2200);

  // Scroll down a bit more to see afternoon/evening stops
  await smoothScrollTo(780, 1000);
  await sleep(2000);
  await moveMouseSmooth(600, 520, 600);

  // Sync wait until Scene 6 start (102.21s)
  const scene6Start = timings.scenes[5].start * 1000;
  while (Date.now() - startTime < scene6Start) {
    await sleep(50);
  }

  // ==========================================
  // SCENE 6: Candidate Places & Pipeline Transparency Trace (102.21s - 119.86s)
  // ==========================================
  console.log('Executing Scene 6: Candidate Places & Pipeline Transparency Trace...');
  await page.evaluate(() => window.updateIndicator('6/7 • Candidates & Latency Trace'));

  // Move to right sidebar: "Places that match your taste"
  await moveMouseSmooth(1380, 420, 800);
  await sleep(2500);
  await moveMouseSmooth(1380, 560, 700);
  await sleep(2000);

  // Click open `<summary>` "How the agent built this"
  const summaryBox = await page.evaluate(() => {
    const s = document.querySelector('summary');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (summaryBox) {
    await clickAt(summaryBox.x, summaryBox.y);
    console.log('Clicked "How the agent built this" accordion!');
    await sleep(2000);
    // Point to trace entries
    await moveMouseSmooth(summaryBox.x, summaryBox.y + 60, 600);
    await sleep(3500);
  }

  // Sync wait until Scene 7 start (119.86s)
  const scene7Start = timings.scenes[6].start * 1000;
  while (Date.now() - startTime < scene7Start) {
    await sleep(50);
  }

  // ==========================================
  // SCENE 7: Multi-Day Navigation, Plain-Text Export & Wrap-up (119.86s - 138.42s)
  // ==========================================
  console.log('Executing Scene 7: Multi-Day Navigation, Plain-Text Export & Wrap-up...');
  await page.evaluate(() => window.updateIndicator('7/7 • Export & Conclusion'));

  // Scroll up to Day tabs
  await smoothScrollTo(360, 800);
  await sleep(500);

  // Click "Sunday" or Day 2 tab
  const dayTabs = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
    return tabs.map((t) => {
      const r = t.getBoundingClientRect();
      return { text: t.innerText.trim(), x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  });
  if (dayTabs.length > 1) {
    await clickAt(dayTabs[1].x, dayTabs[1].y);
    console.log(`Clicked Day tab: ${dayTabs[1].text}`);
    await sleep(2200);
  }

  // Scroll to top
  await smoothScrollTo(0, 800);
  await sleep(600);

  // Click "Copy plan"
  const copyBtnBox = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.innerText.includes('Copy plan') || el.innerText.includes('Copied'));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (copyBtnBox) {
    await clickAt(copyBtnBox.x, copyBtnBox.y);
    console.log('Clicked "Copy plan"!');
    await sleep(2500);
  }

  // Center cursor gracefully for final concluding shot
  await moveMouseSmooth(960, 340, 1000);

  // Wait until total duration completes
  const totalMs = TOTAL_DURATION * 1000;
  while (Date.now() - startTime < totalMs) {
    await sleep(50);
  }

  console.log(`Recording complete! Total frames captured: ${frameCount}`);

  // Stop screencast and close browser
  await client.send('Page.stopScreencast');
  await browser.close();

  // Close FFmpeg stdin and wait for process exit
  ffmpegProc.stdin.end();
  await new Promise((resolve) => ffmpegProc.on('close', resolve));
  console.log('FFmpeg recording finished cleanly!');
}

run().catch((err) => {
  console.error('Fatal error during screencast recording:', err);
  process.exit(1);
});
