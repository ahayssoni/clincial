import { $, connect, remaining, clock, phaseName, tipFor, breathing } from '../shared/lib.js';

const moss = window.moss;
const body = document.body;
const card = $('#card');
const kicker = $('#kicker');
const time = $('#time');
const title = $('#title');
const tip = $('#tip');
const breathLabel = $('#breathLabel');
const primary = $('#primary');
const secondary = $('#secondary');
const breath = breathing($('#breath'), breathLabel);
const calm = matchMedia('(prefers-reduced-motion: reduce)');

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

// break (running) | paused | waiting (break not started) | ready (break over)
function stateOf(st) {
  if (st.phase === 'focus') return 'ready';
  if (st.status === 'running') return 'break';
  return st.status === 'paused' ? 'paused' : 'waiting';
}

function render() {
  body.style.setProperty('--veil', s.settings.veilStrength);
  const state = stateOf(s);
  if (body.dataset.state !== state) {
    // The break ending is a real change of scene: let the card settle in again.
    if (body.dataset.state && !calm.matches) {
      card.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'ease-out' });
    }
    body.dataset.state = state;
  }

  if (state === 'break') {
    kicker.textContent = phaseName(s);
    time.textContent = clock(remaining(s));
    title.textContent = '';
    tip.textContent = tipFor(s, seed);
    breath.start();
    // Neither choice is primary: the default is to rest.
    setActions(s.canPostpone ? ['Finish this thought · 2 min', 'postpone'] : null, ['Back to focus', 'focusNow'], false);
  } else if (state === 'ready') {
    kicker.textContent = 'Break’s over';
    time.textContent = '';
    title.textContent = 'Ready when you are.';
    tip.textContent = s.intention ? `Back to ${s.intention.replace(/[.!?…]+$/, '')}.` : '';
    breath.stop();
    setActions(['Later', 'dismissVeil'], ['Start focus', 'start'], true);
  } else {
    kicker.textContent = phaseName(s);
    time.textContent = clock(remaining(s));
    title.textContent = '';
    tip.textContent = 'Take your time.';
    breath.stop();
    breathLabel.textContent = state === 'paused' ? 'Paused' : '';
    setActions(['Back to focus', 'focusNow'], [state === 'paused' ? 'Resume break' : 'Start break', 'start'], true);
  }
}

function setActions(second, first, emphasize) {
  actions = { secondary: second?.[1], primary: first?.[1] };
  secondary.textContent = second?.[0] || '';
  primary.textContent = first?.[0] || '';
  primary.classList.toggle('primary', emphasize);
}

primary.addEventListener('click', () => actions.primary && moss.act(actions.primary));
secondary.addEventListener('click', () => actions.secondary && moss.act(actions.secondary));
