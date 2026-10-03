import { $, connect, remaining, clock, minutesLeft, duration, phaseName, mood, ring, setIcon, tipFor, breathing, goalDots } from '../shared/lib.js';

const moss = window.moss;
const body = document.body;
const time = $('#time');
const phase = $('#phase');
const intention = $('#intention');
const tip = $('#tip');
const goal = $('#goal');
const todayText = $('#todayText');
const toggle = $('#toggle');
const arc = ring($('#arc'));
const breath = breathing($('#breath'), $('#breathLabel'));
const calm = matchMedia('(prefers-reduced-motion: reduce)');

let s = null;
let breakSeed = 0;
let lastKey = '';

setIcon($('#reset'), 'reset', 'Reset');
setIcon($('#skip'), 'skip', 'Skip');
setIcon($('#settings'), 'sliders', 'Settings');
setIcon($('#close'), 'close', 'Close focus display (Esc)');
setIcon($('#move'), 'move', 'Move to the next display');

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

  renderTime(rem);
  arc.set(s.durationMs ? rem / s.durationMs : 0, { instant });
  phase.textContent = phaseText(s);

  if (m === 'break') {
    tip.textContent = s.status === 'idle' ? 'Start your break when you’re ready.' : tipFor(s, breakSeed);
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

// Quiet mode: while focus runs and the screen is idle, whole minutes only.
function renderTime(rem) {
  const quiet = s.settings.fadeWidget && s.status === 'running' && s.phase === 'focus' && body.classList.contains('idle') && rem > 60000;
  const key = quiet ? `q${minutesLeft(rem)}` : clock(rem);
  if (key === lastKey) return;
  const swapped = lastKey !== '' && lastKey.startsWith('q') !== quiet;
  if (quiet) time.innerHTML = `${minutesLeft(rem)}<small>min</small>`;
  else time.textContent = clock(rem);
  lastKey = key;
  if (swapped && !calm.matches) time.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
}

function phaseText(st) {
  const name = phaseName(st);
  if (st.status === 'paused') return `${name} · paused`;
  if (st.phase === 'focus' && !st.grace && st.completed + 1 >= st.settings.longEvery) return `${name} · long break next`;
  return name;
}

function renderToday() {
  const { sessions, minutes } = s.today;
  const target = s.settings.dailyGoal;
  goalDots(goal, s, 24);
  const spent = minutes ? ` · ${duration(minutes)}` : '';
  todayText.textContent =
    sessions >= target ? `Daily goal reached${spent}` : sessions ? `${sessions} of ${target} sessions today${spent}` : `Today’s goal: ${target} sessions`;
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
function renderClock() {
  $('#now').textContent = timeFmt.format(new Date());
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

// Intention: what you are studying. Saved on Enter or when you click away.
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
