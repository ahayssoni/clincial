import { $, connect, duration } from '../shared/lib.js';

const moss = window.moss;
let s = null;

const PRESETS = [
  { label: 'Classic', values: { focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4 } },
  { label: 'Deep reading', values: { focusMin: 50, shortMin: 10, longMin: 20, longEvery: 3 } },
];
const AMBIENCES = [
  ['off', 'Off'],
  ['rain', 'Rain'],
  ['brown', 'Brown noise'],
  ['drift', 'Drift'],
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
  const down = Object.assign(document.createElement('button'), { textContent: '−', ariaLabel: 'Less' });
  const out = document.createElement('output');
  const up = Object.assign(document.createElement('button'), { textContent: '+', ariaLabel: 'More' });
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
  root.render = () => root.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(isOn(b.dataset.value))));
}

const matches = (p) => Object.entries(p.values).every(([k, v]) => s.settings[k] === v);
segmented(
  $('#preset'),
  [...PRESETS.map((p, i) => [String(i), p.label]), ['custom', 'Custom']],
  (v) => (v === 'custom' ? !PRESETS.some(matches) : matches(PRESETS[v])),
  (v) => v !== 'custom' && update(PRESETS[v].values),
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
  document.querySelectorAll('.stepper, .segmented').forEach((el) => el.render());
  document.querySelectorAll('.switch').forEach((el) => el.setAttribute('aria-checked', String(Boolean(s.settings[el.dataset.key]))));
  document.querySelectorAll('.slider').forEach((el) => {
    if (document.activeElement !== el) el.value = s.settings[el.dataset.key];
    paintSlider(el);
  });
  document.querySelectorAll('[data-needs]').forEach((row) => {
    const need = s.settings[row.dataset.needs];
    row.classList.toggle('disabled', !need || need === 'off');
  });

  const select = $('#display');
  const options = [['', 'Automatic'], ...s.displays.map((d) => [String(d.id), d.label])];
  if (select.options.length !== options.length || [...select.options].some((o, i) => o.value !== options[i][0])) {
    select.replaceChildren(...options.map(([value, text]) => new Option(text, value)));
  }
  select.value = s.settings.focusDisplayId === null ? '' : String(s.settings.focusDisplayId);
  if (select.selectedIndex < 0) select.value = '';
  $('#openFocus').textContent = s.focusDisplay ? 'Close' : 'Open';

  $('#shortcut').innerHTML = `Press <kbd>${s.shortcut}</kbd> anywhere to start or pause.`;
  renderToday();
}

function renderToday() {
  const { sessions, minutes } = s.today;
  $('#todayValue').textContent = duration(minutes);
  $('#todaySub').textContent =
    sessions >= s.settings.dailyGoal ? `${sessions} sessions · goal reached` : `${sessions} of ${s.settings.dailyGoal} sessions`;

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
      fill.style.height = `${d.minutes ? Math.max(4, (d.minutes / peak) * 100) : 0}%`;
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
