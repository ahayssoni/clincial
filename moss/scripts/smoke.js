'use strict';

// Smoke test for a packaged build. Launches the real app, walks through a
// full focus → break → focus cycle, and measures startup, responsiveness,
// CPU, memory and frame pacing. Run after `electron-builder`:
//
//   node scripts/smoke.js
//
// Fails on any renderer error or broken flow. Performance numbers are reported
// (and written to the GitHub job summary when available); CI machines have no
// GPU, so real hardware will do better than these numbers.

const fs = require('fs');
const path = require('path');
const { _electron } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'smoke-output');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findApp() {
  const candidates = {
    darwin: ['dist/mac-universal/Moss.app/Contents/MacOS/Moss', 'dist/mac-arm64/Moss.app/Contents/MacOS/Moss', 'dist/mac/Moss.app/Contents/MacOS/Moss'],
    win32: ['dist/win-unpacked/Moss.exe'],
    linux: ['dist/linux-unpacked/moss'],
  }[process.platform];
  const found = (candidates || []).map((p) => path.join(ROOT, p)).find((p) => fs.existsSync(p));
  if (!found) throw new Error(`No packaged app found for ${process.platform}. Run electron-builder first.`);
  return found;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const errors = [];
  const metrics = {};
  const executablePath = findApp();
  console.log('Launching', executablePath);

  const t0 = Date.now();
  const app = await _electron.launch({ executablePath, args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
  const watch = (page) => {
    page.on('console', (m) => m.type() === 'error' && errors.push(`${name(page)}: ${m.text()}`));
    page.on('pageerror', (e) => errors.push(`${name(page)}: ${e.message}`));
  };
  app.on('window', watch);
  app.windows().forEach(watch);

  // Drive everything through the window.moss API (not DOM selectors) so the
  // test survives design changes.
  const widget = await windowNamed(app, 'widget');
  await widget.evaluate(() => window.moss.getState().then(() => new Promise((r) => requestAnimationFrame(() => r()))));
  metrics.startupMs = Date.now() - t0;
  await windowNamed(app, 'sound');
  await widget.screenshot({ path: path.join(OUT, 'widget-ready.png') });

  // Responsiveness: action -> main process -> state back in the renderer.
  metrics.actionLatencyMs = await widget.evaluate(
    () =>
      new Promise((resolve) => {
        const start = performance.now();
        const off = window.moss.onState((s) => {
          if (s.status === 'running') {
            off();
            resolve(Math.round(performance.now() - start));
          }
        });
        window.moss.act('start');
      }),
  );
  await widget.evaluate(() => window.moss.act('pause'));
  await widget.evaluate(() => window.moss.updateSettings({ focusMin: 1, shortMin: 1, ambience: 'rain', volume: 0.3 }));
  await widget.evaluate(() => window.moss.setIntention('Smoke test'));
  await widget.evaluate(() => window.moss.act('reset'));
  await wait(300);
  await widget.evaluate(() => window.moss.act('start'));

  // Resource use while a session runs quietly in the background.
  await sampleCpu(app); // first sample primes the counters
  await wait(10000);
  const idle = await sampleCpu(app);
  metrics.cpuWhileFocusingPct = idle.cpu;
  metrics.memoryMb = idle.memoryMb;
  await widget.mouse.move(120, 44);
  await wait(400);
  await widget.screenshot({ path: path.join(OUT, 'widget-running.png') });

  // Focus display on the current screen.
  let t = Date.now();
  await widget.evaluate(() => window.moss.openFocusDisplay());
  const focus = await windowNamed(app, 'focus');
  await focus.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
  metrics.focusDisplayOpenMs = Date.now() - t;
  await wait(1000);
  metrics.focusDisplayFrames = await framePacing(focus, 3000);
  await sampleCpu(app);
  await wait(5000);
  metrics.cpuWithFocusDisplayPct = (await sampleCpu(app)).cpu;
  await focus.screenshot({ path: path.join(OUT, 'focus-display.png') });
  await focus.evaluate(() => window.moss.closeFocusDisplay());
  await wait(800);

  // Let the one-minute session end by itself; the veil must appear.
  const state = await widget.evaluate(() => window.moss.getState());
  const leftMs = Math.max(0, state.endsAt - Date.now());
  console.log(`Waiting ${Math.round(leftMs / 1000)}s for the session to end on its own...`);
  t = Date.now() + leftMs;
  const veil = await windowNamed(app, 'veil', leftMs + 15000);
  metrics.veilDelayMs = Math.max(0, Date.now() - t);
  await wait(1600);
  const afterFocus = await widget.evaluate(() => window.moss.getState());
  check(afterFocus.phase === 'short' && afterFocus.status === 'running', `break should be running, got ${afterFocus.phase}/${afterFocus.status}`);
  check(afterFocus.today.sessions === 1, `one session should be recorded, got ${afterFocus.today.sessions}`);
  const displays = await app.evaluate(({ screen }) => screen.getAllDisplays().length);
  check((await veilWindows(app)).length === displays, 'one veil per display');
  metrics.veilFrames = await framePacing(veil, 3000);
  await veil.screenshot({ path: path.join(OUT, 'veil.png') });

  // The grace period hides the veil; skipping brings it back; skipping again shows "ready".
  await veil.evaluate(() => window.moss.act('postpone'));
  await wait(1200);
  check((await veilWindows(app)).length === 0, 'veil hides during the grace period');
  await widget.evaluate(() => window.moss.act('skip'));
  const veil2 = await windowNamed(app, 'veil');
  await wait(800);
  await veil2.evaluate(() => window.moss.act('skip'));
  await wait(800);
  await veil2.screenshot({ path: path.join(OUT, 'veil-ready.png') });
  await veil2.evaluate(() => window.moss.act('start'));
  await wait(1200);
  const back = await widget.evaluate(() => window.moss.getState());
  check(back.phase === 'focus' && back.status === 'running', 'focus runs again after the break');
  check((await veilWindows(app)).length === 0, 'veil gone once focus runs');

  await widget.evaluate(() => window.moss.openSettings());
  const settings = await windowNamed(app, 'settings');
  await wait(800);
  await settings.screenshot({ path: path.join(OUT, 'settings.png') });

  await app.close();
  report(metrics, errors);
}

const failures = [];
function check(ok, message) {
  if (!ok) failures.push(message);
}

function name(page) {
  return path.basename(page.url(), '.html');
}

async function windowNamed(app, label, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const page = app.windows().find((p) => p.url().endsWith(`/${label}.html`));
    if (page) {
      await page.waitForLoadState('domcontentloaded');
      return page;
    }
    await wait(50);
  }
  throw new Error(`Window "${label}" did not open within ${timeout} ms`);
}

async function veilWindows(app) {
  return app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed() && w.webContents.getURL().endsWith('/veil.html')).map((w) => w.id),
  );
}

async function sampleCpu(app) {
  return app.evaluate(({ app: electronApp }) => {
    const all = electronApp.getAppMetrics();
    const cpu = all.reduce((sum, p) => sum + p.cpu.percentCPUUsage, 0);
    const memoryMb = all.reduce((sum, p) => sum + p.memory.workingSetSize, 0) / 1024;
    return { cpu: Math.round(cpu * 10) / 10, memoryMb: Math.round(memoryMb) };
  });
}

// Frame-to-frame times while animations run. 60 fps is 16.7 ms per frame.
async function framePacing(page, ms) {
  return page.evaluate(
    (duration) =>
      new Promise((resolve) => {
        const deltas = [];
        let last = performance.now();
        const end = last + duration;
        const step = (now) => {
          deltas.push(now - last);
          last = now;
          if (now < end) requestAnimationFrame(step);
          else {
            deltas.sort((a, b) => a - b);
            const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
            resolve({
              fps: Math.round(1000 / avg),
              p95FrameMs: Math.round(deltas[Math.floor(deltas.length * 0.95)] * 10) / 10,
              longFrames: deltas.filter((d) => d > 50).length,
            });
          }
        };
        requestAnimationFrame(step);
      }),
    ms,
  );
}

function report(metrics, errors) {
  const rows = [
    ['Startup to first paint', `${metrics.startupMs} ms`],
    ['Start/pause round trip', `${metrics.actionLatencyMs} ms`],
    ['CPU while focusing (all processes)', `${metrics.cpuWhileFocusingPct}%`],
    ['Memory, working set incl. shared (all processes)', `${metrics.memoryMb} MB`],
    ['Focus display open', `${metrics.focusDisplayOpenMs} ms`],
    ['Focus display frames', `${metrics.focusDisplayFrames.fps} fps, p95 ${metrics.focusDisplayFrames.p95FrameMs} ms, ${metrics.focusDisplayFrames.longFrames} long`],
    ['CPU with focus display', `${metrics.cpuWithFocusDisplayPct}%`],
    ['Veil after session end', `${metrics.veilDelayMs} ms`],
    ['Veil frames', `${metrics.veilFrames.fps} fps, p95 ${metrics.veilFrames.p95FrameMs} ms, ${metrics.veilFrames.longFrames} long`],
  ];
  const problems = [...failures, ...errors];
  const md = [
    `### Moss smoke test (${process.platform}/${process.arch})`,
    '',
    '| Check | Result |',
    '|---|---|',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    '',
    problems.length ? `**Problems**\n\n${problems.map((p) => `- ${p}`).join('\n')}` : 'Flow passed with no renderer errors.',
    '',
  ].join('\n');
  console.log(md);
  fs.writeFileSync(path.join(OUT, 'report.md'), md);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  if (problems.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
