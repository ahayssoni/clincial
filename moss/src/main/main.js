'use strict';

const path = require('path');
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  screen,
  nativeImage,
  Notification,
  globalShortcut,
  powerMonitor,
} = require('electron');
const T = require('./timer');
const { createStore, sanitizeSettings, todayStats, recentDays } = require('./store');

const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const canClickThrough = isMac || isWin; // setIgnoreMouseEvents({ forward }) is macOS/Windows only

const RENDERER = path.join(__dirname, '..', 'renderer');
const ASSETS = path.join(__dirname, '..', '..', 'assets');
const PRELOAD = path.join(__dirname, '..', 'preload.js');

const SHORTCUT = 'CommandOrControl+Alt+Shift+P';
const SHORTCUT_LABEL = isMac ? '⌘⌥⇧P' : 'Ctrl+Alt+Shift+P';
const WIDGET_SIZE = { width: 312, height: 100 };
const VEIL_FADE_MS = 700;

let store;
let settings;
let state;
let tray = null;
let phaseTimer = null;
let trayTicker = null;
let focusDisplayId = null;
let veilVisible = false;
let shortcutOk = false;
const win = { widget: null, focus: null, settings: null, sound: null };
const veils = new Map();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWidget());
  app.whenReady().then(boot);
}

// Moss lives in the menu bar / tray. Closing windows never quits it.
app.on('window-all-closed', () => {});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event) => event.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});

app.on('before-quit', () => {
  store?.flush();
  globalShortcut.unregisterAll();
});

function boot() {
  if (isMac) app.dock.hide();
  if (isWin) app.setAppUserModelId('app.moss.timer');

  store = createStore(path.join(app.getPath('userData'), 'moss.json'));
  settings = store.data.settings;
  state = T.create(settings);

  createSoundWindow();
  createWidget();
  createTray();
  registerShortcut();
  applyLoginItem();

  screen.on('display-added', onDisplaysChanged);
  screen.on('display-removed', onDisplaysChanged);
  screen.on('display-metrics-changed', onDisplaysChanged);
  powerMonitor.on('resume', schedule);
}

// ---------------------------------------------------------------------------
// Timer

function act(type) {
  const now = Date.now();
  const prev = state;
  switch (type) {
    case 'toggle':
      state = T.toggle(state, now);
      break;
    case 'start':
      state = T.start(state, now);
      break;
    case 'pause':
      state = T.pause(state, now);
      break;
    case 'reset':
      state = T.reset(state, settings);
      break;
    case 'skip':
      state = T.complete(state, settings, now);
      break;
    case 'postpone':
      state = T.postpone(state, now);
      break;
    case 'focusNow':
      if (state.phase !== 'focus') state = T.complete(state, settings, now);
      state = T.start(state, now);
      break;
    case 'dismissVeil':
      hideVeil();
      break;
    default:
      return;
  }
  transition(prev, now);
}

function schedule() {
  clearTimeout(phaseTimer);
  if (state.status !== 'running') return;
  phaseTimer = setTimeout(onPhaseTimer, Math.max(0, state.endsAt - Date.now()) + 15);
}

function onPhaseTimer() {
  const now = Date.now();
  if (state.status !== 'running') return;
  if (state.endsAt - now > 50) return schedule(); // woke early (sleep, drift)
  const prev = state;
  state = T.complete(state, settings, now);
  transition(prev, now);
}

function transition(prev, now) {
  const changedPhase = prev.phase !== state.phase || prev.grace !== state.grace;
  if (changedPhase) {
    if (prev.phase === 'focus' && !prev.grace) recordFocus(prev, now);
    onPhaseChange(prev);
  }
  // The veil follows the timer: up while a break runs, gone once focus runs.
  if (settings.veil && !veilVisible && state.phase !== 'focus' && state.status === 'running') showVeil();
  if (veilVisible && state.phase === 'focus' && state.status === 'running') hideVeil();
  schedule();
  broadcast();
}

function recordFocus(prev, now) {
  const ms = T.elapsed(prev, now);
  if (ms < 60 * 1000) return;
  store.data.history.push({
    end: now,
    minutes: Math.round((ms / 60000) * 10) / 10,
    counted: ms >= prev.durationMs / 2,
    intention: store.data.intention || undefined,
  });
  store.save();
}

function onPhaseChange(prev) {
  const toBreak = state.phase !== 'focus';
  if (toBreak) {
    if (prev.grace) return;
    chime('rest');
    if (!settings.veil || state.status !== 'running') {
      notify('Time for a break', state.status === 'running' ? 'Look away from your screen for a bit.' : 'Start your break when you’re ready.');
    }
    return;
  }
  if (state.grace) return;
  // A break just ended.
  chime('focus');
  if (!veilVisible && state.status !== 'running') notify('Break’s over', 'Ready when you are.');
}

// ---------------------------------------------------------------------------
// State fan-out

function snapshot() {
  const now = Date.now();
  return {
    ...state,
    now,
    canPostpone: T.canPostpone(state),
    settings,
    intention: store.data.intention,
    today: todayStats(store.data.history, now),
    week: recentDays(store.data.history, now),
    veil: veilVisible,
    focusDisplay: win.focus ? { displayId: focusDisplayId } : null,
    displays: listDisplays(),
    widgetCompact: Boolean(store.data.widget.compact),
    platform: process.platform,
    shortcut: shortcutOk ? SHORTCUT_LABEL : null,
  };
}

function windows() {
  return [win.widget, win.focus, win.settings, win.sound, ...veils.values()].filter((w) => w && !w.isDestroyed());
}

function broadcast() {
  const snap = snapshot();
  for (const w of windows()) w.webContents.send('state', snap);
  updateTray();
}

function chime(kind) {
  if (settings.chimes) win.sound?.webContents.send('sound', { type: 'chime', kind });
}

function notify(title, body) {
  if (Notification.isSupported()) new Notification({ title, body, silent: true }).show();
}

// ---------------------------------------------------------------------------
// Windows

function prefs(extra = {}) {
  return {
    preload: PRELOAD,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    backgroundThrottling: false,
    spellcheck: false,
    ...extra,
  };
}

function load(w, name) {
  w.loadFile(path.join(RENDERER, name, `${name}.html`));
}

// Floats above other apps, including full-screen ones on macOS.
function float(w, level) {
  w.setAlwaysOnTop(true, level);
  if (isMac) w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

function createSoundWindow() {
  win.sound = new BrowserWindow({
    show: false,
    width: 200,
    height: 100,
    skipTaskbar: true,
    webPreferences: prefs({ autoplayPolicy: 'no-user-gesture-required' }),
  });
  load(win.sound, 'sound');
}

function widgetBounds() {
  const { x, y } = store.data.widget;
  if (Number.isFinite(x) && Number.isFinite(y)) {
    const fits = screen.getAllDisplays().some((d) => {
      const a = d.workArea;
      return x >= a.x - 20 && y >= a.y - 14 && x + WIDGET_SIZE.width <= a.x + a.width + 20 && y + WIDGET_SIZE.height <= a.y + a.height + 26;
    });
    if (fits) return { x, y, ...WIDGET_SIZE };
  }
  const a = screen.getPrimaryDisplay().workArea;
  return { x: a.x + a.width - WIDGET_SIZE.width - 8, y: a.y + 8, ...WIDGET_SIZE };
}

function createWidget() {
  win.widget = new BrowserWindow({
    ...widgetBounds(),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    // Clicking the timer should not pull focus away from what you are studying.
    focusable: !canClickThrough,
    ...(isMac ? { type: 'panel' } : {}),
    webPreferences: prefs(),
  });
  float(win.widget, 'floating');
  load(win.widget, 'widget');
  win.widget.once('ready-to-show', () => {
    if (!store.data.widget.hidden) win.widget.showInactive();
  });
  win.widget.on('closed', () => (win.widget = null));
}

function showWidget() {
  store.data.widget.hidden = false;
  store.save();
  if (!win.widget) createWidget();
  else if (!veilVisible) win.widget.showInactive();
  broadcast();
}

function hideWidget() {
  store.data.widget.hidden = true;
  store.save();
  win.widget?.hide();
  broadcast();
}

function saveWidgetPosition() {
  if (!win.widget) return;
  // Keep the pill reachable: clamp the window to the display it ended up on.
  const b = win.widget.getBounds();
  const a = screen.getDisplayMatching(b).workArea;
  const x = Math.min(Math.max(b.x, a.x - 20), a.x + a.width - b.width + 20);
  const y = Math.min(Math.max(b.y, a.y - 14), a.y + a.height - b.height + 26);
  if (x !== b.x || y !== b.y) win.widget.setBounds({ x, y, ...WIDGET_SIZE });
  store.data.widget.x = x;
  store.data.widget.y = y;
  store.save();
}

function listDisplays() {
  const primary = screen.getPrimaryDisplay();
  return screen.getAllDisplays().map((d, i) => {
    const name = d.label || (d.id === primary.id ? 'Main display' : `Display ${i + 1}`);
    return { id: d.id, label: `${name} (${d.size.width}×${d.size.height})`, primary: d.id === primary.id };
  });
}

function pickFocusDisplay(id) {
  const all = screen.getAllDisplays();
  const chosen = all.find((d) => d.id === id) || all.find((d) => d.id === settings.focusDisplayId);
  if (chosen) return chosen;
  // Default to the screen that is not showing the floating timer.
  const widgetDisplay = win.widget ? screen.getDisplayMatching(win.widget.getBounds()) : screen.getPrimaryDisplay();
  return all.find((d) => d.id !== widgetDisplay.id) || widgetDisplay;
}

function openFocusDisplay(id) {
  const display = pickFocusDisplay(id);
  if (win.focus && focusDisplayId === display.id) {
    win.focus.show();
    return;
  }
  // Moving between screens: a fresh window is more reliable than un-fullscreening.
  if (win.focus) {
    win.focus.removeAllListeners('closed');
    win.focus.destroy();
  }
  focusDisplayId = display.id;
  const w = new BrowserWindow({
    ...display.bounds,
    frame: false,
    show: false,
    title: 'Moss',
    backgroundColor: '#03120b',
    autoHideMenuBar: true,
    webPreferences: prefs(),
  });
  win.focus = w;
  load(w, 'focus');
  w.once('ready-to-show', () => {
    if (isMac) w.setSimpleFullScreen(true);
    else w.setFullScreen(true);
    w.show();
  });
  w.on('closed', () => {
    if (win.focus !== w) return;
    win.focus = null;
    focusDisplayId = null;
    if (veilVisible) syncVeils();
    broadcast();
  });
  if (veilVisible) syncVeils();
  broadcast();
}

function closeFocusDisplay() {
  win.focus?.close();
}

function openSettings() {
  if (win.settings) {
    win.settings.show();
    win.settings.focus();
    return;
  }
  win.settings = new BrowserWindow({
    width: 460,
    height: 760,
    minWidth: 440,
    minHeight: 480,
    show: false,
    title: 'Moss Settings',
    backgroundColor: '#071c12',
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    ...(isMac
      ? { titleBarStyle: 'hiddenInset' }
      : { titleBarStyle: 'hidden', titleBarOverlay: { color: '#071c12', symbolColor: '#afc4b5', height: 44 } }),
    webPreferences: prefs(),
  });
  load(win.settings, 'settings');
  win.settings.once('ready-to-show', () => {
    if (isMac) app.focus({ steal: true });
    win.settings.show();
  });
  win.settings.on('closed', () => (win.settings = null));
}

// ---------------------------------------------------------------------------
// Break veil: a translucent green wash on every screen except the one already
// showing the focus display (that one turns green by itself).

function showVeil() {
  veilVisible = true;
  syncVeils();
  win.widget?.hide();
}

function hideVeil() {
  if (!veilVisible) return;
  veilVisible = false;
  const closing = [...veils.values()];
  veils.clear();
  for (const w of closing) if (!w.isDestroyed()) w.webContents.send('veil:leave');
  setTimeout(() => closing.forEach((w) => !w.isDestroyed() && w.destroy()), VEIL_FADE_MS);
  if (win.widget && !store.data.widget.hidden) win.widget.showInactive();
  broadcast();
}

function syncVeils() {
  const wanted = screen.getAllDisplays().filter((d) => !(win.focus && d.id === focusDisplayId));
  for (const [id, w] of veils) {
    if (!wanted.some((d) => d.id === id)) {
      veils.delete(id);
      if (!w.isDestroyed()) w.destroy();
    }
  }
  for (const d of wanted) {
    const existing = veils.get(d.id);
    if (existing) existing.setBounds(d.bounds);
    else veils.set(d.id, createVeil(d));
  }
}

function createVeil(display) {
  const w = new BrowserWindow({
    ...display.bounds,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    show: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    enableLargerThanScreen: true,
    ...(isMac ? { type: 'panel' } : {}),
    webPreferences: prefs(),
  });
  float(w, 'screen-saver');
  w.setBounds(display.bounds);
  load(w, 'veil');
  w.once('ready-to-show', () => w.showInactive());
  return w;
}

function onDisplaysChanged() {
  if (win.focus && !screen.getAllDisplays().some((d) => d.id === focusDisplayId)) closeFocusDisplay();
  if (veilVisible) syncVeils();
  saveWidgetPosition();
  broadcast();
}

// ---------------------------------------------------------------------------
// Tray / menu bar

function trayImage() {
  const file = isMac ? 'trayTemplate.png' : 'tray.png';
  const image = nativeImage.createFromPath(path.join(ASSETS, file));
  if (isMac) image.setTemplateImage(true);
  return image;
}

function createTray() {
  tray = new Tray(trayImage());
  tray.setToolTip('Moss');
  if (!isMac) tray.on('click', () => tray.popUpContextMenu());
  updateTray();
}

function remainingText() {
  const total = Math.ceil(T.remaining(state, Date.now()) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function statusLine() {
  const name = state.grace ? 'Wrapping up' : state.phase === 'focus' ? 'Focus' : state.phase === 'short' ? 'Short break' : 'Long break';
  if (state.status === 'running') return `${name} · ${Math.ceil(T.remaining(state, Date.now()) / 60000)} min left`;
  if (state.status === 'paused') return `${name} · paused at ${remainingText()}`;
  return state.phase === 'focus' ? 'Ready to focus' : `${name} · ready`;
}

function buildMenu() {
  const displays = listDisplays();
  const toggleLabel = state.status === 'running' ? 'Pause' : state.status === 'paused' ? 'Resume' : 'Start';
  return Menu.buildFromTemplate([
    { label: statusLine(), enabled: false },
    { type: 'separator' },
    { label: toggleLabel, accelerator: shortcutOk && isMac ? SHORTCUT : undefined, click: () => act('toggle') },
    { label: state.phase === 'focus' && !state.grace ? 'Skip to break' : 'Skip break', click: () => act('skip') },
    { label: 'Reset', enabled: state.status !== 'idle', click: () => act('reset') },
    { type: 'separator' },
    {
      label: 'Floating timer',
      type: 'checkbox',
      checked: !store.data.widget.hidden,
      click: (item) => (item.checked ? showWidget() : hideWidget()),
    },
    {
      label: 'Focus display',
      submenu: [
        ...displays.map((d) => ({
          label: d.label,
          type: 'checkbox',
          checked: Boolean(win.focus) && focusDisplayId === d.id,
          click: () => openFocusDisplay(d.id),
        })),
        { type: 'separator' },
        { label: 'Close focus display', enabled: Boolean(win.focus), click: closeFocusDisplay },
      ],
    },
    { type: 'separator' },
    { label: 'Settings…', accelerator: isMac ? 'Command+,' : undefined, click: openSettings },
    { label: 'Quit Moss', accelerator: isMac ? 'Command+Q' : undefined, click: () => app.quit() },
  ]);
}

let lastTrayText = null;
let lastMenuLine = null;

function updateTray() {
  if (!tray) return;
  lastMenuLine = null; // rebuild: checkboxes and labels may have changed
  clearInterval(trayTicker);
  trayTicker = null;
  paintTray();
  if (state.status === 'running') trayTicker = setInterval(paintTray, 500);
}

function paintTray() {
  const line = statusLine();
  if (line !== lastMenuLine) {
    lastMenuLine = line;
    tray.setContextMenu(buildMenu());
  }
  const text = state.status === 'running' ? remainingText() : state.status === 'paused' ? 'Paused' : '';
  if (text === lastTrayText) return;
  lastTrayText = text;
  if (isMac) tray.setTitle(settings.menuBarTime && text ? ` ${text}` : '', { fontType: 'monospacedDigit' });
  else tray.setToolTip(text ? `Moss · ${text}` : 'Moss');
}

// ---------------------------------------------------------------------------
// System integration

function registerShortcut() {
  try {
    shortcutOk = globalShortcut.register(SHORTCUT, () => act('toggle'));
  } catch {
    shortcutOk = false;
  }
}

function applyLoginItem() {
  if (isMac || isWin) app.setLoginItemSettings({ openAtLogin: Boolean(settings.openAtLogin) });
}

// ---------------------------------------------------------------------------
// IPC

ipcMain.handle('state:get', () => snapshot());
ipcMain.on('act', (_event, type) => act(type));

ipcMain.on('settings:update', (_event, patch) => {
  const clean = sanitizeSettings(patch);
  if (!Object.keys(clean).length) return;
  settings = { ...settings, ...clean };
  store.data.settings = settings;
  store.save();
  state = T.applySettings(state, settings);
  if ('openAtLogin' in clean) applyLoginItem();
  if ('menuBarTime' in clean) lastTrayText = null;
  if (!settings.veil && veilVisible) hideVeil();
  if ('focusDisplayId' in clean && win.focus) openFocusDisplay(settings.focusDisplayId);
  schedule();
  broadcast();
});

ipcMain.on('intention', (_event, text) => {
  store.data.intention = String(text || '')
    .trim()
    .slice(0, 120);
  store.save();
  broadcast();
});

ipcMain.on('focus:open', (_event, id) => openFocusDisplay(Number.isFinite(id) ? id : null));
ipcMain.on('focus:close', closeFocusDisplay);
ipcMain.on('settings:open', openSettings);
ipcMain.on('app:quit', () => app.quit());

ipcMain.on('menu:show', (event) => {
  const owner = BrowserWindow.fromWebContents(event.sender);
  buildMenu().popup({ window: owner });
});

ipcMain.on('sound:preview', (_event, name) => {
  if (['rain', 'brown', 'drift'].includes(name)) win.sound?.webContents.send('sound', { type: 'preview', name });
});

ipcMain.on('widget:ignore', (_event, ignore) => {
  if (canClickThrough) win.widget?.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
});

ipcMain.on('widget:move', (_event, x, y) => {
  if (!win.widget || !Number.isFinite(x) || !Number.isFinite(y)) return;
  // setBounds with an explicit size avoids the window slowly growing on
  // mixed-DPI setups on Windows.
  win.widget.setBounds({ x: Math.round(x), y: Math.round(y), ...WIDGET_SIZE });
});

ipcMain.on('widget:drag-end', saveWidgetPosition);

ipcMain.on('widget:compact', (_event, compact) => {
  store.data.widget.compact = Boolean(compact);
  store.save();
  broadcast();
});
