'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_SETTINGS = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  dailyGoal: 6,
  autoStartBreaks: true,
  autoStartFocus: false,
  veil: true,
  veilStrength: 0.62,
  fadeWidget: true,
  chimes: true,
  ambience: 'off', // 'off' | 'rain' | 'brown' | 'drift'
  volume: 0.5,
  ambienceInBreaks: false,
  menuBarTime: true,
  openAtLogin: false,
  focusDisplayId: null,
};

// Allowed ranges for anything a renderer can change. Unknown keys are dropped.
const LIMITS = {
  focusMin: [1, 180],
  shortMin: [1, 60],
  longMin: [1, 90],
  longEvery: [1, 12],
  dailyGoal: [1, 24],
  veilStrength: [0.2, 0.9],
  volume: [0, 1],
};
const AMBIENCES = ['off', 'rain', 'brown', 'drift'];
const HISTORY_DAYS = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

function sanitizeSettings(patch) {
  const out = {};
  for (const [key, value] of Object.entries(patch || {})) {
    if (!(key in DEFAULT_SETTINGS)) continue;
    if (key in LIMITS) {
      const n = Number(value);
      if (!Number.isFinite(n)) continue;
      const [lo, hi] = LIMITS[key];
      out[key] = Math.min(hi, Math.max(lo, n));
    } else if (key === 'ambience') {
      if (AMBIENCES.includes(value)) out[key] = value;
    } else if (key === 'focusDisplayId') {
      if (value === null) out[key] = null;
      else if (Number.isFinite(Number(value))) out[key] = Number(value);
    } else if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
      out[key] = Boolean(value);
    }
  }
  return out;
}

function defaults() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    history: [],
    widget: { x: null, y: null, compact: false },
    intention: '',
  };
}

function load(file) {
  const data = defaults();
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.settings = { ...DEFAULT_SETTINGS, ...sanitizeSettings(raw.settings) };
    if (Array.isArray(raw.history)) {
      data.history = raw.history.filter((h) => h && Number.isFinite(h.end) && Number.isFinite(h.minutes));
    }
    if (raw.widget && typeof raw.widget === 'object') data.widget = { ...data.widget, ...raw.widget };
    if (typeof raw.intention === 'string') data.intention = raw.intention.slice(0, 120);
  } catch {
    // First launch or unreadable file: start fresh.
  }
  return data;
}

function createStore(file) {
  const data = load(file);
  let timer = null;

  function writeNow() {
    clearTimeout(timer);
    timer = null;
    const cutoff = Date.now() - HISTORY_DAYS * DAY_MS;
    data.history = data.history.filter((h) => h.end >= cutoff);
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
      fs.renameSync(tmp, file);
    } catch (err) {
      console.error('Moss: could not save data', err);
    }
  }

  return {
    data,
    save() {
      clearTimeout(timer);
      timer = setTimeout(writeNow, 400);
    },
    flush() {
      if (timer) writeNow();
    },
  };
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStats(history, now) {
  const key = dayKey(now);
  let sessions = 0;
  let minutes = 0;
  for (const h of history) {
    if (dayKey(h.end) !== key) continue;
    sessions += h.counted === false ? 0 : 1;
    minutes += h.minutes;
  }
  return { sessions, minutes: Math.round(minutes) };
}

// Minutes focused on each of the last `days` local days, oldest first.
function recentDays(history, now, days = 7) {
  const out = [];
  const totals = new Map();
  for (const h of history) totals.set(dayKey(h.end), (totals.get(dayKey(h.end)) || 0) + h.minutes);
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    const key = dayKey(d.getTime());
    out.push({ key, weekday: d.getDay(), minutes: Math.round(totals.get(key) || 0) });
  }
  return out;
}

module.exports = { DEFAULT_SETTINGS, sanitizeSettings, createStore, load, dayKey, todayStats, recentDays };
