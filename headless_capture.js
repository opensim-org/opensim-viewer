/**
 * headless_capture.js
 *
 * Headlessly renders a React Three Fiber app (e.g. opensim-viewer running on
 * localhost or Vercel) and captures either a single frame or a frame sequence
 * for a movie.
 *
 * Two capture modes:
 *   --mode image   : single screenshot after the scene settles
 *   --mode movie   : steps through animation time and screenshots each frame,
 *                    for deterministic frame-by-frame output (then stitch
 *                    with ffmpeg - see bottom of file)
 *
 * Usage:
 *   npm install playwright
 *   npx playwright install chromium
 *   node headless_capture.js --url http://localhost:3000 --mode image
 *   node headless_capture.js --url http://localhost:3000 --mode movie --duration 5 --fps 30
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  console.log('Raw arguments:', process.argv.slice(2));
  const args = {};
  process.argv.slice(2).forEach((arg, i, arr) => {
    if (arg.startsWith('--')) args[arg.slice(2)] = arr[i + 1];
  });
  console.log('Parsed arguments:', args);
  return {
    url: args.url || 'http://localhost:3000',
    mode: args.mode || 'image',
    duration: parseFloat(args.duration || '5'),
    fps: parseInt(args.fps || '30', 10),
    outDir: args.out || 'capture-output',
  };
}

async function main() {
  const { url, mode, duration, fps, outDir } = parseArgs();
  console.log(`Capturing ${mode} from ${url} to ${outDir}...`);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    // --use-gl=swiftshader / angle gives software WebGL in headless mode,
    // since there's no real GPU in most CI/server environments.
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    // Passive video recording alternative to manual frame stepping:
    // recordVideo: { dir: outDir, size: { width: 1600, height: 900 } },
  });
  const page = await context.newPage();

  // Surface page-side console errors/warnings - WebGL context issues in
  // headless mode are easy to miss otherwise.
  page.on('console', (msg) => console.log(`[page] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => console.error('[page error]', err));

  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for the scene to actually be ready rather than a fixed sleep.
  // Have the app set `window.__sceneReady = true` once its model/animation
  // has loaded (a MobX autorun or useEffect after the R3F Canvas mounts is a
  // good place for this) so this script isn't guessing at timing.
  await page.waitForFunction(() => window.__sceneReady === true, { timeout: 30000 });

  if (mode === 'image') {
    console.log('Capturing single frame...');
    const canvas = page.locator('canvas').first();
    await canvas.screenshot({ path: path.join(outDir, 'frame.png') });
    console.log(`Saved ${outDir}/frame.png`);
  } else if (mode === 'movie') {
    const totalFrames = Math.round(duration * fps);
    const canvas = page.locator('canvas').first();

    for (let i = 0; i < totalFrames; i++) {
      const t = i / fps;

      // Have the app expose a deterministic seek hook (wired to the same
      // AnimationMixer/timeline state your DollyDialog keyframe system
      // already drives) rather than relying on real-time playback, which
      // won't stay in sync with wall-clock screenshot timing.
      await page.evaluate((time) => window.__seekAnimation?.(time), t);

      // Let R3F actually commit the frame after the seek before capturing.
      await page.waitForTimeout(16);

      const frameName = `frame_${String(i).padStart(5, '0')}.png`;
      await canvas.screenshot({ path: path.join(outDir, frameName) });
    }
    console.log(`Saved ${totalFrames} frames to ${outDir}/`);
    console.log(
      `Stitch into a movie with:\n` +
      `  ffmpeg -framerate ${fps} -i ${outDir}/frame_%05d.png ` +
      `-c:v libx264 -pix_fmt yuv420p ${outDir}/movie.mp4`
    );
  }

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
