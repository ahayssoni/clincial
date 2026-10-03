// Shared helpers for every Moss window. The main process owns the timer;
// windows receive snapshots and count down locally from `endsAt`.

export const $ = (sel, root = document) => root.querySelector(sel);

export function connect(onState) {
  window.moss.getState().then(onState);
  window.moss.onState(onState);
}

export function remaining(s, now = Date.now()) {
  return s.status === 'running' ? Math.max(0, s.endsAt - now) : s.remainingMs;
}

export function clock(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function minutesLeft(ms) {
  return Math.max(1, Math.ceil(ms / 60000));
}

export function duration(minutes) {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

const PHASE = { focus: 'Focus', short: 'Short break', long: 'Long break' };

export function phaseName(s) {
  if (s.grace) return 'Wrapping up';
  return PHASE[s.phase];
}

// Short enough for the floating pill.
export function statusLabel(s) {
  if (s.grace) return 'Wrapping up';
  if (s.status === 'paused') return 'Paused';
  if (s.status === 'idle') return s.phase === 'focus' ? 'Ready' : 'Break ready';
  return PHASE[s.phase];
}

// Visual mood for CSS: focus | break | paused | ready | final | grace
export function mood(s, rem) {
  if (s.grace) return 'grace';
  if (s.status === 'paused') return 'paused';
  if (s.status === 'idle') return s.phase === 'focus' ? 'ready' : 'break';
  if (s.phase !== 'focus') return 'break';
  return rem <= 60000 ? 'final' : 'focus';
}

// Today's sessions against the daily goal, one dot each: done, past the goal
// (extra), and the session in progress (now). Same meaning on every surface.
export function goalDots(el, s, max) {
  const { sessions } = s.today;
  const goal = s.settings.dailyGoal;
  const count = Math.min(max, Math.max(goal, sessions));
  if (el.children.length !== count) el.replaceChildren(...Array.from({ length: count }, () => document.createElement('i')));
  const live = s.phase === 'focus' && !s.grace && s.status !== 'idle';
  [...el.children].forEach((dot, i) => {
    const kind = i < Math.min(sessions, goal) ? 'done' : i < sessions ? 'extra' : live && i === sessions ? 'now' : '';
    if (dot.className !== kind) dot.className = kind;
  });
}

// A progress ring drawn with an SVG circle using pathLength="100".
// Progress animates linearly between once-per-second updates.
export function ring(circle) {
  let last = null;
  return {
    set(fraction, { instant = false } = {}) {
      const offset = (100 - Math.max(0, Math.min(1, fraction)) * 100).toFixed(3);
      if (offset === last) return;
      if (instant) {
        circle.style.transition = 'none';
        circle.style.strokeDashoffset = offset;
        circle.getBoundingClientRect();
        circle.style.transition = '';
      } else {
        circle.style.strokeDashoffset = offset;
      }
      last = offset;
    },
  };
}

const path = (d, extra = '') => `<path d="${d}" ${extra}/>`;
const stroke = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  play: `<svg viewBox="0 0 24 24">${path('M8 5.6v12.8a1.1 1.1 0 0 0 1.66.95l10.3-6.4a1.1 1.1 0 0 0 0-1.9L9.66 4.65A1.1 1.1 0 0 0 8 5.6z', 'fill="currentColor"')}</svg>`,
  pause: `<svg viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1.3" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.3" fill="currentColor"/></svg>`,
  skip: `<svg viewBox="0 0 24 24">${path('M5.5 6.3v11.4a1 1 0 0 0 1.55.83l8.2-5.7a1 1 0 0 0 0-1.66l-8.2-5.7A1 1 0 0 0 5.5 6.3z', 'fill="currentColor"')}<rect x="16.6" y="5.2" width="2.4" height="13.6" rx="1.2" fill="currentColor"/></svg>`,
  reset: `<svg viewBox="0 0 24 24">${path('M4.8 12a7.2 7.2 0 1 0 2.1-5.1', stroke)}${path('M4.6 4.4v3.4H8', stroke)}</svg>`,
  display: `<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="12" rx="2.2" ${stroke}/>${path('M9 20h6M12 16.5V20', stroke)}</svg>`,
  close: `<svg viewBox="0 0 24 24">${path('M6.5 6.5l11 11M17.5 6.5l-11 11', stroke)}</svg>`,
  sliders: `<svg viewBox="0 0 24 24">${path('M4 7.5h9M18 7.5h2M4 16.5h3M11 16.5h9', stroke)}<circle cx="15.5" cy="7.5" r="2.3" ${stroke}/><circle cx="8.5" cy="16.5" r="2.3" ${stroke}/></svg>`,
  move: `<svg viewBox="0 0 24 24">${path('M13 4.5H5.2A2.2 2.2 0 0 0 3 6.7v7.6a2.2 2.2 0 0 0 2.2 2.2h13.6a2.2 2.2 0 0 0 2.2-2.2V12', stroke)}${path('M9 20h6M12 16.5V20M16 7.5h5M18.5 5l2.5 2.5L18.5 10', stroke)}</svg>`,
};

export function setIcon(button, name, label) {
  if (button.dataset.icon !== name) {
    button.innerHTML = icons[name];
    button.dataset.icon = name;
  }
  if (label) button.setAttribute('aria-label', label);
  if (label) button.title = label;
}

// Short break prompts for students. Mostly eye and body resets (screens all
// day), with one retrieval prompt in each rotation: recalling without notes
// is one of the best-supported study habits.
const TIPS = {
  short: [
    'Look at something far away for twenty seconds.',
    'Let your shoulders drop. Unclench your jaw.',
    'Without looking, recall the three main ideas from that session.',
    'Close your eyes and take three slow breaths.',
    'Have some water.',
    'Stand up and stretch your back.',
    'Blink slowly a few times and rest your eyes.',
  ],
  long: [
    'Step away from your desk for a few minutes.',
    'Get some fresh air if you can.',
    'Without your notes, sum up what you covered in a sentence or two.',
    'Refill your water and have a snack.',
    'Take a short walk. Let your mind wander.',
    'Lie down for a few minutes and close your eyes.',
  ],
};

export function tipFor(s, seed) {
  const list = TIPS[s.phase === 'long' ? 'long' : 'short'];
  return list[Math.abs(seed) % list.length];
}

// A paced breathing guide: 4s in, 6s out (about six breaths a minute).
export const BREATH = { inhale: 4000, exhale: 6000 };

export function breathing(el, label) {
  let timer = null;
  let running = false;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const say = (text) => {
    label.textContent = text;
    if (!calm.matches) label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease-out' });
  };
  const cycle = () => {
    say('Breathe in');
    el.classList.remove('out');
    el.classList.add('in');
    timer = setTimeout(() => {
      say('Breathe out');
      el.classList.remove('in');
      el.classList.add('out');
      timer = setTimeout(cycle, BREATH.exhale);
    }, BREATH.inhale);
  };
  return {
    start() {
      if (running) return;
      running = true;
      cycle();
    },
    stop() {
      if (!running) return;
      running = false;
      clearTimeout(timer);
      label.textContent = '';
      el.classList.remove('in', 'out');
    },
  };
}
