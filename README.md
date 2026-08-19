# Novit

A floating, always-on-top Markdown scratchpad for quick notes that live in plain `.md` files.

![Electron](https://img.shields.io/badge/Electron-39-2C5745) ![electron-vite](https://img.shields.io/badge/electron--vite-5-EB7D00) ![License](https://img.shields.io/badge/License-MIT-2E2910)

Novit is a tiny frameless window that stays on top of everything. Hit the global hotkey, jot down a thought, and close it — every keystroke is autosaved to a `.md` file on disk.

## Features

- **Floating scratchpad** — frameless, always-on-top window (toggle with the pin button)
- **Global hotkey** — `Ctrl+Shift+N` shows/hides the window from anywhere
- **WYSIWYG editor** — write with a formatting toolbar; Markdown stays readable underneath
- **Live preview** — render as you type (GFM), with **clickable task checkboxes** that write back to your notes
- **Autosave** — debounced saving to `%APPDATA%/novit/notes/*.md`; your notes are plain files you own
- **Notes sidebar** — create, rename, delete, and search notes
- **Command palette** — `Ctrl+K` to switch notes and run actions without touching the mouse
- **System tray** — quick show/hide, new note, and quit from the tray icon
- **Themes** — olive (default), purple, cyan, and crimson palettes, persisted across restarts
- **Pixel-art glass UI** — scanline texture, hard shadows, and a warm pixel palette

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+N` | Show / hide the window (global) |
| `Ctrl+N` | New note |
| `Ctrl+K` | Open command palette |
| `Esc` | Close palette |

## Project setup

```bash
npm install
```

### Development

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

### Build

```bash
# Windows installer + unpacked build
npm run build:win

# Unpacked build only
npm run build:unpack
```

Output lands in `dist/` (`novit-<version>-setup.exe` installer, `win-unpacked/novit.exe` portable).

## Tech stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org)
- [marked](https://marked.js.org/) for Markdown rendering
- [turndown](https://github.com/mixmark-io/turndown) for WYSIWYG → Markdown conversion

## Where are my notes?

Notes are saved as individual Markdown files in your OS user-data directory:

- **Windows:** `%APPDATA%/novit/notes`
- **macOS:** `~/Library/Application Support/novit/notes`
- **Linux:** `~/.config/novit/notes`

Back them up, sync them, edit them with any editor — they're just `.md` files.

## License

[MIT](LICENSE)