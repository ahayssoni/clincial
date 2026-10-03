# Moss

A calm Pomodoro timer for studying. It floats above your notes, slides and
problem sets, covers your screens in a soft green veil when it is time to rest,
and can turn a second monitor into a quiet full-screen focus display.

Runs on macOS and Windows (Electron). No accounts, no network, no tracking.
Everything is stored in one JSON file on your machine.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
cd moss
npm install
npm start
```

Moss lives in the menu bar (macOS) or the system tray (Windows). The floating
timer appears in the top-right corner. Drag it anywhere and it stays there.

## Install it as an app

Build on the machine you want to install it on:

```bash
npm run dist:mac   # on your Mac  -> dist/Moss-<version>.dmg
npm run dist:win   # on Windows   -> dist/Moss Setup <version>.exe
```

The builds are not code-signed. An app you build on your own Mac opens normally.
If you copy a build to another Mac, right-click it and choose **Open** the first
time. On Windows, SmartScreen may ask you to confirm with **More info → Run anyway**.

## How it works

| | |
|---|---|
| **Floating timer** | Always on top, even over full-screen apps on macOS. Clicks pass through everything except the pill itself. Hover for controls, double-click to shrink it to a ring, right-click for the menu. The dots are today's sessions toward your daily goal. |
| **Quiet mode** | While focus runs, the floating timer dims and shows whole minutes only, so nothing flickers in the corner of your eye. The focus display does the same once the mouse is still, and its background stops drifting. Seconds come back on hover (or mouse move) and in the final minute. |
| **Break veil** | When a break starts, every screen gets a translucent green wash with a breathing guide and a short rest prompt (eye and body resets, and now and then a quick recall of what you just studied). The middle of the veil stays deep green so the text is readable over a white page; *Veil strength* sets how much of your screen shows through around it. |
| **Finish this thought** | When the veil arrives mid-problem, take two more minutes. Once per break. |
| **Focus display** | Full screen on the monitor of your choice (by default, the one without the floating timer). Shows the time, what you are studying, and today's progress. Click the line under the timer to write what you are studying. |
| **Sound** | Soft chimes at each transition. Optional ambience while you focus: rain, brown noise, or soft tones (a slow synth pad). All synthesized, no audio files. |
| **Today** | Sessions and minutes per day, a daily goal, and the last seven days in Settings. A session counts toward the goal if you did at least half of it. |

### Shortcuts

| Keys | Action |
|---|---|
| `⌘⌥⇧P` / `Ctrl+Alt+Shift+P` | Start or pause from anywhere |
| `Space` | Start or pause (focus display) |
| `Esc` | Close the focus display |
| `Enter` | Save what you are studying and start (focus display) |

### Presets

- **Classic**: 25 min focus, 5 min break, 15 min long break every 4 sessions.
- **Deep study**: 50 / 10, with a 20 min long break every 3 sessions.

Choose **Custom** in Settings to set each length yourself.

## Your data

Settings and history live in `moss.json` in the app's user-data folder:

- macOS: `~/Library/Application Support/Moss/`
- Windows: `%APPDATA%\Moss\`

History older than 120 days is pruned.

## Development

```bash
npm test   # timer state machine and storage tests
```

```
src/
  main/
    main.js     windows, tray, veil, IPC
    timer.js    pure Pomodoro state machine (tested)
    store.js    settings, history, stats (tested)
  preload.js    the small, explicit bridge renderers can use
  renderer/
    shared/     design tokens and helpers
    widget/     floating pill
    focus/      full-screen focus display
    veil/       break veil
    settings/   settings window
    sound/      hidden audio engine (Web Audio)
```

The main process owns the timer. Windows receive snapshots and count down
locally from `endsAt`, so every surface shows the same time without polling.
