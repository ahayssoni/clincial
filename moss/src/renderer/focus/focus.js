import { $, connect, remaining, clock, duration, phaseName, mood, ring, setIcon, tipFor, breathing } from '../shared/lib.js';

const moss = window.moss;
const body = document.body;
const time = $('#time');
const phase = $('#phase');
const cycle = $('#cycle');
const intention = $('#intention');
const tip = $('#tip');
const goal = $('#goal');
const todayText = $('#todayText');
const toggle = $('#toggle');
const arc = ring($('#arc'));
const breath = breathing($('#breath'), $('#breathLabel'));

let s = null;
let breakSeed = 0;

setIcon($('#reset'), 'reset', 'Reset');
setIcon($('#skip'), 'skip', 'Skip');
setIcon($('#settings'), 'sliders', 'Settings');
setIcon($('#close'), 'close', 'Close focus display (Esc)');
setIcon($('#move'), 'next', 'Move to the next display');

connect((next) => {
  const prev = s;
  const instant = !prev || prev.phase !== next.phase || prev.grace !== next.grace || prev.status !== next.status;
  if (!prev || prev.phase !== next.phase) breakSeed = Math.floor(Math.random() * 1000);
  s = next;
  if (document.activeElement !== intention) intention.value = s.intention || '';
  render(instant);
  wake();
});
setInterval(() => s && render(false), 250);

function render(instant) {
  const rem = remaining(s);
  const m = mood(s, rem);
  body.dataset.mood = m;

  time.textContent = clock(rem);
  arc.set(s.durationMs ? rem / s.durationMs : 0, { instant });
  phase.textContent = phaseName(s);
  cycle.textContent = s.phase === 'focus' && !s.grace ? `Session ${Math.min(s.completed + 1, s.settings.longEvery)} of ${s.settings.longEvery}` : '';

  if (m === 'break') {
    tip.textContent = s.status === 'idle' ? 'Start your break when you are ready.' : tipFor(s, breakSeed);
  } else {
    tip.textContent = '';
  }
  if (m === 'break' && s.status === 'running') breath.start();
  else breath.stop();

  setIcon(toggle, s.status === 'running' ? 'pause' : 'play', s.status === 'running' ? 'Pause (Space)' : 'Start (Space)');
  $('#skip').title = s.phase === 'focus' && !s.grace ? 'Skip to break' : 'Skip break';
  $('#move').hidden = s.displays.length < 2;

  renderToday();
  renderClock();
}

function renderToday() {
  const { sessions, minutes } = s.today;
  const target = s.settings.dailyGoal;
  const count = Math.min(24, Math.max(target, sessions));
  if (goal.children.length !== count) goal.replaceChildren(...Array.from({ length: count }, () => document.createElement('i')));
  [...goal.children].forEach((dot, i) => {
    dot.className = i < Math.min(sessions, target) ? 'done' : i < sessions ? 'extra' : '';
  });
  const spent = minutes ? ` · ${duration(minutes)}` : '';
  todayText.textContent =
    sessions >= target ? `Daily goal reached${spent}` : sessions ? `${sessions} of ${target} sessions today${spent}` : `Goal: ${target} sessions today`;
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
function renderClock() {
  const now = new Date();
  $('#now').textContent = timeFmt.format(now);
  $('#date').textContent = dateFmt.format(now);
}

// Controls
toggle.addEventListener('click', () => moss.act('toggle'));
$('#reset').addEventListener('click', () => moss.act('reset'));
$('#skip').addEventListener('click', () => moss.act('skip'));
$('#settings').addEventListener('click', () => moss.openSettings());
$('#close').addEventListener('click', () => moss.closeFocusDisplay());
$('#move').addEventListener('click', () => {
  const ids = s.displays.map((d) => d.id);
  const here = ids.indexOf(s.focusDisplay?.displayId);
  moss.openFocusDisplay(ids[(here + 1) % ids.length]);
});

// Intention: what you are reading. Saved on Enter or when you click away.
function commitIntention() {
  const value = intention.value.trim();
  if (value !== (s?.intention || '')) moss.setIntention(value);
}
intention.addEventListener('change', commitIntention);
intention.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    intention.blur();
    if (s.status !== 'running' && s.phase === 'focus') moss.act('start');
  }
  if (e.key === 'Escape') {
    intention.value = s.intention || '';
    intention.blur();
    e.stopPropagation();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target === intention) return;
  if (e.key === ' ') {
    e.preventDefault();
    moss.act('toggle');
  } else if (e.key === 'Escape') {
    moss.closeFocusDisplay();
  }
});

// Hide the chrome and cursor while the timer runs and the mouse is still.
let idleTimer = null;
function wake() {
  body.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (s?.status === 'running' && document.activeElement !== intention) body.classList.add('idle');
  }, 3000);
}
document.addEventListener('mousemove', wake);
document.addEventListener('keydown', wake);
