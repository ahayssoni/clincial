import { $, connect, remaining, clock, minutesLeft, statusLabel, mood, ring, setIcon, goalDots } from '../shared/lib.js';

const moss = window.moss;
const pill = $('#pill');
const time = $('#time');
const label = $('#label');
const mins = $('#mins');
const dots = $('#dots');
const toggle = $('#toggle');
const skip = $('#skip');
const expand = $('#expand');
const arc = ring($('#arc'));

let s = null;
let hovered = false;
let lastActive = Date.now();
let lastKey = '';
let drag = null;
let pending = null;

connect((next) => {
  const instant = !s || s.phase !== next.phase || s.grace !== next.grace || s.status !== next.status;
  if (instant) lastActive = Date.now();
  s = next;
  render(instant);
});
setInterval(() => s && render(false), 250);

function render(instant) {
  const rem = remaining(s);
  const m = mood(s, rem);
  pill.dataset.mood = m;
  pill.classList.toggle('compact', Boolean(s.widgetCompact));

  // Quiet mode: while you study, show whole minutes so nothing flickers in the
  // corner of your eye. Seconds come back on hover and in the final minute.
  const quiet = s.settings.fadeWidget && s.status === 'running' && !hovered && rem > 60000;
  const key = quiet ? `q${minutesLeft(rem)}` : clock(rem);
  if (key !== lastKey) {
    if (quiet) time.innerHTML = `${minutesLeft(rem)}<small>min</small>`;
    else time.textContent = clock(rem);
    lastKey = key;
  }
  mins.textContent = rem > 60000 ? minutesLeft(rem) : Math.ceil(rem / 1000);
  label.textContent = statusLabel(s);
  arc.set(s.durationMs ? rem / s.durationMs : 0, { instant });

  const resting = s.settings.fadeWidget && s.status === 'running' && s.phase === 'focus' && !hovered && Date.now() - lastActive > 2500;
  pill.classList.toggle('resting', resting);

  renderDots();
  // Hints only while idle, so a tooltip never pops up mid-session.
  pill.title = s.status === 'idle' ? 'Drag to move · Double-click to shrink · Right-click for settings' : '';
  setIcon(toggle, s.status === 'running' ? 'pause' : 'play', s.status === 'running' ? 'Pause' : 'Start');
  setIcon(skip, 'skip', s.phase === 'focus' && !s.grace ? 'Skip to break' : 'Skip break');
  setIcon(expand, 'display', s.focusDisplay ? 'Close focus display' : 'Open focus display');
}

function renderDots() {
  const total = Math.max(s.settings.dailyGoal, s.today.sessions);
  const asCount = total > 10;
  dots.classList.toggle('count', asCount);
  const count = `${s.today.sessions}/${s.settings.dailyGoal}`;
  if (asCount && dots.textContent !== count) dots.textContent = count;
  if (!asCount) goalDots(dots, s, 10);
}

toggle.addEventListener('click', () => moss.act('toggle'));
skip.addEventListener('click', () => moss.act('skip'));
expand.addEventListener('click', () => (s?.focusDisplay ? moss.closeFocusDisplay() : moss.openFocusDisplay()));

// Click-through outside the pill. The window forwards mouse moves while ignoring
// clicks, so we can switch back the moment the cursor reaches the pill.
let ignoring = null;
function setIgnore(value) {
  if (value === ignoring) return;
  ignoring = value;
  moss.widget.setIgnoreMouse(value);
}
setIgnore(true);

function setHover(value) {
  if (value) lastActive = Date.now();
  if (value === hovered) return;
  hovered = value;
  pill.classList.toggle('hover', value);
  if (s) render(false);
}

document.addEventListener('mousemove', (e) => {
  const over = pill.contains(e.target);
  setIgnore(!over && !drag);
  setHover(over || Boolean(drag));
});
pill.addEventListener('mouseleave', () => !drag && setHover(false));
setInterval(() => !drag && hovered && !pill.matches(':hover') && setHover(false), 500);

// Dragging is done by hand (not -webkit-app-region) so hover and double-click
// keep working on Windows.
pill.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || e.target.closest('button')) return;
  drag = { sx: e.screenX, sy: e.screenY, wx: window.screenX, wy: window.screenY, moved: false };
  pill.setPointerCapture(e.pointerId);
});

pill.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.screenX - drag.sx;
  const dy = e.screenY - drag.sy;
  if (!drag.moved && Math.hypot(dx, dy) < 3) return;
  drag.moved = true;
  pill.classList.add('dragging');
  if (!pending) requestAnimationFrame(flushMove);
  pending = { x: drag.wx + dx, y: drag.wy + dy };
});

function flushMove() {
  if (pending) moss.widget.move(pending.x, pending.y);
  pending = null;
}

function endDrag() {
  if (drag?.moved) moss.widget.dragEnd();
  drag = null;
  pill.classList.remove('dragging');
}
pill.addEventListener('pointerup', endDrag);
pill.addEventListener('pointercancel', endDrag);

pill.addEventListener('dblclick', (e) => {
  if (e.target.closest('button') || !s) return;
  s.widgetCompact = !s.widgetCompact;
  moss.widget.setCompact(s.widgetCompact);
  render(false);
});

pill.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  moss.showMenu();
});
