import { $, connect, duration } from '../shared/lib.js';

const moss = window.moss;
let s = null;
let customOpen = null; // the rhythm steppers, shown only for a custom rhythm

const PRESETS = [
  { label: 'Classic', values: { focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4 } },
  { label: 'Deep study', values: { focusMin: 50, shortMin: 10, longMin: 20, longEvery: 3 } },
];
const AMBIENCES = [
  ['off', 'Off'],
  ['rain', 'Rain'],
  ['brown', 'Brown noise'],
  ['drift', 'Soft tones'],
];
const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const update = (patch) => {
  Object.assign(s.settings, patch);
  moss.updateSettings(patch);
  render();
};

document.querySelectorAll('[data-platform]').forEach((el) => {
  if (el.dataset.platform !== moss.platform) el.remove();
});

// Steppers
document.querySelectorAll('.stepper').forEach((el) => {
  const { key, unit } = el.dataset;
  const [min, max, step] = ['min', 'max', 'step'].map((k) => Number(el.dataset[k]));
  const name = el.previousElementSibling.textContent.trim();
  const down = Object.assign(document.createElement('button'), { textContent: '−', ariaLabel: `Decrease ${name}` });
  const out = document.createElement('output');
  const up = Object.assign(document.createElement('button'), { textContent: '+', ariaLabel: `Increase ${name}` });
  el.append(down, out, up);
  const nudge = (dir) => {
    const value = s.settings[key];
    const next = dir > 0 ? Math.floor(value / step) * step + step : Math.ceil(value / step) * step - step;
    update({ [key]: Math.min(max, Math.max(min, next)) });
  };
  down.addEventListener('click', () => nudge(-1));
  up.addEventListener('click', () => nudge(1));
  el.render = () => {
    const v = s.settings[key];
    out.textContent = `${v} ${unit === 'sessions' && v === 1 ? 'session' : unit}`;
    down.disabled = v <= min;
    up.disabled = v >= max;
  };
});

// Switches
document.querySelectorAll('.switch').forEach((el) => {
  el.setAttribute('aria-label', el.previousElementSibling.firstChild.textContent.trim());
  el.addEventListener('click', () => update({ [el.dataset.key]: !s.settings[el.dataset.key] }));
});

// Sliders
document.querySelectorAll('.slider').forEach((el) => {
  el.addEventListener('input', () => {
    paintSlider(el);
    update({ [el.dataset.key]: Number(el.value) });
  });
});

function paintSlider(el) {
  const p = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--p', `${p}%`);
}

// Segmented controls
function segmented(root, items, isOn, onPick) {
  root.replaceChildren(
    ...items.map(([value, text]) => {
      const b = document.createElement('button');
      b.setAttribute('role', 'radio');
      b.textContent = text;
      b.dataset.value = value;
      b.addEventListener('click', () => onPick(value));
      return b;
    }),
  );
  root.render = () =>
    root.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-checked', String(isOn(b.dataset.value)));
      b.tabIndex = isOn(b.dataset.value) ? 0 : -1;
    });
  // Radio-group keys: arrows move the choice, one Tab stop for the group.
  root.addEventListener('keydown', (e) => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const buttons = [...root.querySelectorAll('button')];
    const next = buttons[(buttons.indexOf(document.activeElement) + dir + buttons.length) % buttons.length];
    next.focus();
    next.click();
  });
}

const matches = (p) => Object.entries(p.values).every(([k, v]) => s.settings[k] === v);
segmented(
  $('#preset'),
  [...PRESETS.map((p, i) => [String(i), p.label]), ['custom', 'Custom']],
  (v) => (v === 'custom' ? customOpen : !customOpen && matches(PRESETS[v])),
  (v) => {
    customOpen = v === 'custom';
    if (customOpen) render();
    else update(PRESETS[v].values);
  },
);
segmented(
  $('#ambience'),
  AMBIENCES,
  (v) => s.settings.ambience === v,
  (v) => {
    update({ ambience: v });
    if (v !== 'off') moss.previewSound(v);
  },
);

// Focus display screen
$('#display').addEventListener('change', (e) => {
  update({ focusDisplayId: e.target.value === '' ? null : Number(e.target.value) });
});
$('#openFocus').addEventListener('click', () => (s.focusDisplay ? moss.closeFocusDisplay() : moss.openFocusDisplay()));
$('#quit').addEventListener('click', () => moss.quit());

connect((next) => {
  s = next;
  render();
});

function render() {
  if (!PRESETS.some(matches)) customOpen = true; // also catches changes made elsewhere
  else if (customOpen === null) customOpen = false;
  document.querySelectorAll('[data-custom]').forEach((row) => (row.hidden = !customOpen));
  const { focusMin, shortMin } = s.settings;
  $('#presetSummary').textContent = customOpen ? '' : `${focusMin} min focus · ${shortMin} min breaks`;
  document.querySelectorAll('.stepper, .segmented').forEach((el) => el.render());
  document.querySelectorAll('.switch').forEach((el) => el.setAttribute('aria-checked', String(Boolean(s.settings[el.dataset.key]))));
  document.querySelectorAll('.slider').forEach((el) => {
    if (document.activeElement !== el) el.value = s.settings[el.dataset.key];
    paintSlider(el);
  });
  document.querySelectorAll('[data-needs]').forEach((row) => {
    const need = s.settings[row.dataset.needs];
    row.hidden = !need || need === 'off';
  });

  const select = $('#display');
  const options = [['', 'Automatic'], ...s.displays.map((d) => [String(d.id), d.label])];
  if (select.options.length !== options.length || [...select.options].some((o, i) => o.value !== options[i][0])) {
    select.replaceChildren(...options.map(([value, text]) => new Option(text, value)));
  }
  select.value = s.settings.focusDisplayId === null ? '' : String(s.settings.focusDisplayId);
  if (select.selectedIndex < 0) select.value = '';
  $('#openFocus').textContent = s.focusDisplay ? 'Close' : 'Open';

  const kbd = Object.assign(document.createElement('kbd'), { textContent: s.shortcut });
  $('#shortcut').replaceChildren(...(s.shortcut ? ['Start or pause from anywhere with ', kbd, '.'] : []));
  renderToday();
}

function renderToday() {
  const { sessions, minutes } = s.today;
  $('#todayValue').textContent = duration(minutes);
  const goal = s.settings.dailyGoal;
  $('#todaySub').textContent = sessions >= goal ? `${sessions} sessions · goal reached` : sessions ? `${sessions} of ${goal} sessions` : `Goal: ${goal} sessions`;

  const week = $('#week');
  const peak = Math.max(s.settings.focusMin * s.settings.dailyGoal, ...s.week.map((d) => d.minutes));
  week.replaceChildren(
    ...s.week.map((d, i) => {
      const isToday = i === s.week.length - 1;
      const day = document.createElement('div');
      day.className = 'day';
      day.title = `${isToday ? 'Today' : WEEKDAY_LONG[d.weekday]} · ${duration(d.minutes)}`;
      const bar = document.createElement('div');
      bar.className = isToday ? 'bar today-bar' : 'bar';
      const fill = document.createElement('i');
      // Never shorter than its width, so a small day still reads as a capsule.
      fill.style.height = `${d.minutes ? Math.max(23, (d.minutes / peak) * 100) : 0}%`;
      bar.append(fill);
      const letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = WEEKDAY[d.weekday];
      day.append(bar, letter);
      return day;
    }),
  );
  week.setAttribute('aria-label', `Last 7 days: ${s.week.map((d) => `${WEEKDAY_LONG[d.weekday]} ${duration(d.minutes)}`).join(', ')}`);
}
