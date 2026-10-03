import { $, connect, remaining, clock, phaseName, tipFor, breathing } from '../shared/lib.js';

const moss = window.moss;
const body = document.body;
const kicker = $('#kicker');
const time = $('#time');
const title = $('#title');
const tip = $('#tip');
const primary = $('#primary');
const secondary = $('#secondary');
const breath = breathing($('#breath'), $('#breathLabel'));

let s = null;
const seed = Math.floor(Math.random() * 1000);
let actions = {};

connect((next) => {
  s = next;
  if (!s.veil) leave();
  render();
});
moss.onVeilLeave(leave);
setInterval(() => s && render(), 250);

function leave() {
  body.classList.add('leaving');
  breath.stop();
}

function render() {
  body.style.setProperty('--veil', s.settings.veilStrength);
  const rem = remaining(s);
  const onBreak = s.phase !== 'focus';

  if (onBreak && s.status === 'running') {
    kicker.textContent = phaseName(s);
    time.textContent = clock(rem);
    title.textContent = '';
    tip.textContent = tipFor(s, seed);
    breath.start();
    setActions(s.canPostpone ? ['Finish the page · 2 min', 'postpone'] : null, ['Back to focus', 'focusNow']);
  } else if (onBreak) {
    kicker.textContent = s.status === 'paused' ? `${phaseName(s)} · paused` : phaseName(s);
    time.textContent = clock(rem);
    title.textContent = '';
    tip.textContent = 'Take your time.';
    breath.stop();
    setActions(['Back to focus', 'focusNow'], [s.status === 'paused' ? 'Resume break' : 'Start break', 'start']);
  } else {
    // The break is over and focus is waiting for you.
    kicker.textContent = 'Break’s over';
    time.textContent = '';
    title.textContent = 'Ready when you are.';
    tip.textContent = s.intention ? `Back to ${s.intention}.` : '';
    breath.stop();
    setActions(['Later', 'dismissVeil'], ['Start focus', 'start']);
  }
}

function setActions(second, first) {
  actions = { secondary: second?.[1], primary: first?.[1] };
  secondary.textContent = second?.[0] || '';
  primary.textContent = first?.[0] || '';
}

primary.addEventListener('click', () => actions.primary && moss.act(actions.primary));
secondary.addEventListener('click', () => actions.secondary && moss.act(actions.secondary));
