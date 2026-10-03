'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/main/timer');
const { DEFAULT_SETTINGS, sanitizeSettings, todayStats, recentDays } = require('../src/main/store');

const MIN = 60 * 1000;
const settings = { ...DEFAULT_SETTINGS };

test('starts idle on a full focus phase', () => {
  const s = T.create(settings);
  assert.equal(s.phase, 'focus');
  assert.equal(s.status, 'idle');
  assert.equal(T.remaining(s, 0), 25 * MIN);
});

test('pause and resume keep the remaining time', () => {
  let s = T.start(T.create(settings), 1000);
  assert.equal(T.remaining(s, 1000 + 10 * MIN), 15 * MIN);
  s = T.pause(s, 1000 + 10 * MIN);
  assert.equal(s.status, 'paused');
  assert.equal(T.remaining(s, 999 * MIN), 15 * MIN);
  s = T.toggle(s, 50 * MIN);
  assert.equal(s.status, 'running');
  assert.equal(s.endsAt, 50 * MIN + 15 * MIN);
});

test('focus flows into an auto-started short break', () => {
  const s = T.complete(T.start(T.create(settings), 0), settings, 25 * MIN);
  assert.equal(s.phase, 'short');
  assert.equal(s.status, 'running');
  assert.equal(s.completed, 1);
  assert.equal(T.remaining(s, 25 * MIN), 5 * MIN);
});

test('every fourth focus earns a long break, after which the cycle restarts', () => {
  let s = T.create(settings);
  for (let i = 0; i < 3; i++) {
    s = T.complete(s, settings, 0); // focus -> short
    assert.equal(s.phase, 'short');
    s = T.complete(s, settings, 0); // short -> focus
  }
  s = T.complete(s, settings, 0);
  assert.equal(s.phase, 'long');
  assert.equal(T.remaining(s, 0), 15 * MIN);
  s = T.complete(s, settings, 0);
  assert.equal(s.phase, 'focus');
  assert.equal(s.completed, 0);
});

test('after a break focus waits unless auto-start is on', () => {
  const brk = T.complete(T.create(settings), settings, 0);
  assert.equal(T.complete(brk, settings, 0).status, 'idle');
  const auto = { ...settings, autoStartFocus: true };
  assert.equal(T.complete(brk, auto, 0).status, 'running');
});

test('breaks can be held back once for two minutes', () => {
  const brk = T.complete(T.create(settings), settings, 0);
  assert.ok(T.canPostpone(brk));
  let s = T.postpone(brk, 100);
  assert.equal(s.phase, 'focus');
  assert.equal(s.grace, true);
  assert.equal(T.remaining(s, 100), T.GRACE_MS);
  s = T.complete(s, settings, 100 + T.GRACE_MS);
  assert.equal(s.phase, 'short');
  assert.equal(s.status, 'running');
  assert.equal(s.completed, 1, 'grace time is not a new session');
  assert.equal(T.canPostpone(s), false);
  assert.equal(T.postpone(s, 0), s);
});

test('long breaks come back as long breaks after a grace period', () => {
  const s = { ...T.create(settings), completed: 3 };
  const brk = T.complete(s, settings, 0);
  assert.equal(brk.phase, 'long');
  const back = T.complete(T.postpone(brk, 0), settings, T.GRACE_MS);
  assert.equal(back.phase, 'long');
});

test('reset during grace goes back to the waiting break', () => {
  const brk = T.complete(T.create(settings), settings, 0);
  const s = T.reset(T.postpone(brk, 0), settings);
  assert.equal(s.phase, 'short');
  assert.equal(s.status, 'idle');
  assert.equal(s.graceUsed, true);
});

test('new durations apply only to an untouched phase', () => {
  const longer = { ...settings, focusMin: 50 };
  assert.equal(T.applySettings(T.create(settings), longer).remainingMs, 50 * MIN);
  const running = T.start(T.create(settings), 0);
  assert.equal(T.applySettings(running, longer), running);
});

test('settings from renderers are clamped and filtered', () => {
  assert.deepEqual(sanitizeSettings({ focusMin: 999, volume: -1, ambience: 'jazz', hack: 1, veil: 0 }), {
    focusMin: 180,
    volume: 0,
    veil: false,
  });
  assert.deepEqual(sanitizeSettings({ focusDisplayId: '42' }), { focusDisplayId: 42 });
});

test('daily stats count only sessions marked as counted', () => {
  const now = new Date(2026, 9, 3, 18, 0).getTime();
  const history = [
    { end: new Date(2026, 9, 3, 9, 0).getTime(), minutes: 25 },
    { end: new Date(2026, 9, 3, 10, 0).getTime(), minutes: 4, counted: false },
    { end: new Date(2026, 9, 2, 22, 0).getTime(), minutes: 50 },
  ];
  assert.deepEqual(todayStats(history, now), { sessions: 1, minutes: 29 });
  const week = recentDays(history, now);
  assert.equal(week.length, 7);
  assert.equal(week[6].minutes, 29);
  assert.equal(week[5].minutes, 50);
  assert.equal(week[0].minutes, 0);
});
