'use strict';

// Pure Pomodoro state machine. No Electron, no clocks of its own:
// every transition takes `now` so it can be tested deterministically.
//
// phase:     'focus' | 'short' | 'long'
// status:    'idle' | 'running' | 'paused'
// completed: focus sessions finished in the current cycle (resets after a long break)
// grace:     true while running the short "finish the page" extension before a break
// pending:   the break a grace period is holding back
// graceUsed: the current break has already been postponed once

const GRACE_MS = 2 * 60 * 1000;

function phaseMs(phase, settings) {
  const minutes = phase === 'focus' ? settings.focusMin : phase === 'short' ? settings.shortMin : settings.longMin;
  return Math.round(minutes * 60 * 1000);
}

function create(settings) {
  const d = phaseMs('focus', settings);
  return {
    phase: 'focus',
    status: 'idle',
    durationMs: d,
    remainingMs: d,
    endsAt: null,
    completed: 0,
    grace: false,
    pending: null,
    graceUsed: false,
  };
}

function remaining(s, now) {
  return s.status === 'running' ? Math.max(0, s.endsAt - now) : s.remainingMs;
}

function elapsed(s, now) {
  return s.durationMs - remaining(s, now);
}

function start(s, now) {
  if (s.status === 'running') return s;
  return { ...s, status: 'running', endsAt: now + s.remainingMs };
}

function pause(s, now) {
  if (s.status !== 'running') return s;
  return { ...s, status: 'paused', remainingMs: remaining(s, now), endsAt: null };
}

function toggle(s, now) {
  return s.status === 'running' ? pause(s, now) : start(s, now);
}

function enter(s, phase, settings, now, run, extra = {}) {
  const d = phaseMs(phase, settings);
  const next = {
    ...s,
    phase,
    status: 'idle',
    durationMs: d,
    remainingMs: d,
    endsAt: null,
    grace: false,
    pending: null,
    graceUsed: false,
    ...extra,
  };
  return run ? start(next, now) : next;
}

// Restart the current phase from the top, stopped.
function reset(s, settings) {
  if (s.grace) return enter(s, s.pending, settings, null, false, { graceUsed: true });
  const d = phaseMs(s.phase, settings);
  return { ...s, status: 'idle', durationMs: d, remainingMs: d, endsAt: null };
}

// The current phase ran out (or the user skipped to its end).
function complete(s, settings, now) {
  if (s.grace) {
    return enter(s, s.pending, settings, now, true, { graceUsed: true });
  }
  if (s.phase === 'focus') {
    const completed = s.completed + 1;
    const next = completed >= settings.longEvery ? 'long' : 'short';
    return enter({ ...s, completed }, next, settings, now, settings.autoStartBreaks);
  }
  const completed = s.phase === 'long' ? 0 : s.completed;
  return enter({ ...s, completed }, 'focus', settings, now, settings.autoStartFocus);
}

// "Finish the page": hold a break back for two minutes of extra focus. Once per break.
function canPostpone(s) {
  return s.phase !== 'focus' && !s.graceUsed && !s.grace;
}

function postpone(s, now) {
  if (!canPostpone(s)) return s;
  return {
    ...s,
    phase: 'focus',
    status: 'running',
    durationMs: GRACE_MS,
    remainingMs: GRACE_MS,
    endsAt: now + GRACE_MS,
    grace: true,
    pending: s.phase,
  };
}

// Settings changed: an untouched phase picks up its new length immediately.
function applySettings(s, settings) {
  if (s.status !== 'idle' || s.grace) return s;
  const d = phaseMs(s.phase, settings);
  return { ...s, durationMs: d, remainingMs: d };
}

module.exports = {
  GRACE_MS,
  phaseMs,
  create,
  remaining,
  elapsed,
  start,
  pause,
  toggle,
  reset,
  complete,
  canPostpone,
  postpone,
  applySettings,
};
