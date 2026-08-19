<div align="center">

# 📝 Novit

**A floating, always-on-top Markdown scratchpad.**

> `Ctrl+Shift+N` → write → `Esc` → done.
> Every keystroke autosaved to a plain `.md` file. That's it.

🌐 **Website:** [novit-site.vercel.app](https://novit-site.vercel.app)

[![Electron](https://img.shields.io/badge/Electron%2039-2C5745?style=for-the-badge&logo=electron&logoColor=EBE3A7)](https://www.electronjs.org)
[![electron-vite](https://img.shields.io/badge/electron--vite%205-EB7D00?style=for-the-badge&logo=vite&logoColor=2E2910)](https://electron-vite.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-2E2910?style=for-the-badge&logo=javascript&logoColor=EBE3A7)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-2C5745?style=for-the-badge&logo=opensourceinitiative&logoColor=EBE3A7)](LICENSE)

</div>

---

## ✨ What it does

A tiny frameless window that lives on top of everything. Jot down a thought, hit the hotkey again, and it disappears — but nothing is lost. Every note is a real Markdown file on your disk, waiting for you.

## 🎯 Features

| | |
| --- | --- |
| 🪟 **Floating window** | Frameless & always-on-top — pin it or let it float |
| ⌨️ **Global hotkey** | `Ctrl+Shift+N` summons the window from anywhere |
| ✍️ **WYSIWYG editor** | Formatting toolbar, Markdown stays readable underneath |
| 👀 **Live preview** | GFM rendering as you type, with **clickable task checkboxes** that write back to the note |
| 💾 **Autosave** | Debounced saving — your work is never lost |
| 📂 **Notes sidebar** | Create, rename, delete & search notes |
| 🧭 **Command palette** | `Ctrl+K` — switch notes, run actions, no mouse needed |
| 🎨 **4 themes** | Olive, purple, cyan & crimson — persisted across restarts |
| 🖥️ **Tray icon** | Show / hide, new note & quit from the system tray |

## ⌨️ Keyboard shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+Shift+N` | Show / hide the window *(global)* |
| `Ctrl+N` | New note |
| `Ctrl+K` | Open command palette |
| `Esc` | Close palette |

## 🚀 Getting started

```bash
# install dependencies
npm install

# development (hot reload)
npm run dev

# lint
npm run lint
```

### 📦 Building

```bash
# Windows — installer + portable build
npm run build:win

# unpacked portable build only
npm run build:unpack
```

Output lands in `dist/`:

- `novit-<version>-setup.exe` — installer
- `win-unpacked/novit.exe` — portable, no install needed

## 🛠️ Tech stack

| | |
| :--- | :--- |
| 🧱 [Electron](https://www.electronjs.org/) | Desktop runtime |
| ⚡ [electron-vite](https://electron-vite.org) | Fast dev server & build tooling |
| 📖 [marked](https://marked.js.org/) | Markdown → HTML rendering |
| 🔄 [turndown](https://github.com/mixmark-io/turndown) | WYSIWYG HTML → Markdown conversion |

## 📁 Where are my notes?

Notes are plain Markdown files in your OS user-data folder — back them up, sync them, edit them with any tool:

| OS | Path |
| :--- | :--- |
| **Windows** | `%APPDATA%/novit/notes` |
| **macOS** | `~/Library/Application Support/novit/notes` |
| **Linux** | `~/.config/novit/notes` |

## 📄 License

[MIT](LICENSE) © [Ali Sher](https://github.com/alimaandev)