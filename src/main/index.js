import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  Tray,
  Menu,
  nativeImage
} from 'electron'
import { join, basename } from 'path'
import { readdir, readFile, writeFile, mkdir, rename, unlink, stat } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import winIcon from '../../N.ico?asset'

const TOGGLE_HOTKEY = 'CommandOrControl+Shift+N'
const NOTES_DIR = () => join(app.getPath('userData'), 'notes')

let mainWindow = null
let tray = null

function createTray() {
  const trayImage = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(trayImage)
  tray.setToolTip('Novit - Scratchpad')
  tray.on('click', toggleWindow)
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'New note',
        click: () => mainWindow?.webContents.send('tray:new-note')
      },
      { label: 'Show / Hide', click: toggleWindow },
      { type: 'separator' },
      { label: 'Quit Novit', click: () => app.quit() }
    ])
  )
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 560,
    minWidth: 380,
    minHeight: 420,
    show: false,
    frame: false,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    backgroundColor: '#2e2910',
    icon: process.platform === 'win32' ? winIcon : icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized-changed', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized-changed', false)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function toggleWindow() {
  if (!mainWindow) return
  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

function toggleAlwaysOnTop() {
  if (!mainWindow) return
  const next = !mainWindow.isAlwaysOnTop()
  mainWindow.setAlwaysOnTop(next)
  mainWindow.webContents.send('window:always-on-top-changed', next)
  return next
}

function sanitizeName(name) {
  const cleaned = [...String(name)]
    .filter((ch) => ch.charCodeAt(0) > 31 && ch.charCodeAt(0) !== 127)
    .join('')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/[.\s]+$/g, '')
    .trim()
  return cleaned ? `${cleaned}.md` : null
}

function notePath(name) {
  return join(NOTES_DIR(), sanitizeName(name) ?? 'untitled.md')
}

async function ensureNotesDir() {
  await mkdir(NOTES_DIR(), { recursive: true })
}

async function listNotes() {
  await ensureNotesDir()
  const entries = await readdir(NOTES_DIR(), { withFileTypes: true })
  const notes = []
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const file = join(NOTES_DIR(), entry.name)
      const info = await stat(file)
      notes.push({ name: basename(entry.name, '.md'), mtime: info.mtimeMs })
    }
  }
  return notes.sort((a, b) => b.mtime - a.mtime)
}

function registerIpc() {
  ipcMain.handle('notes:list', listNotes)

  ipcMain.handle('notes:read', async (_event, name) => {
    try {
      return await readFile(notePath(name), 'utf-8')
    } catch {
      return ''
    }
  })

  ipcMain.handle('notes:write', async (_event, name, text) => {
    await ensureNotesDir()
    await writeFile(notePath(name), text, 'utf-8')
  })

  ipcMain.handle('notes:create', async (_event, name) => {
    await ensureNotesDir()
    const file = sanitizeName(name) ?? 'untitled.md'
    const path = join(NOTES_DIR(), file)
    try {
      await writeFile(path, '', { flag: 'wx' })
    } catch {
      return basename(file, '.md')
    }
    return basename(file, '.md')
  })

  ipcMain.handle('notes:rename', async (_event, oldName, newName) => {
    const file = sanitizeName(newName)
    if (!file || file === sanitizeName(oldName)) return basename(sanitizeName(oldName), '.md')
    await rename(notePath(oldName), join(NOTES_DIR(), file))
    return basename(file, '.md')
  })

  ipcMain.handle('notes:delete', async (_event, name) => {
    await unlink(notePath(name))
  })

  ipcMain.handle('window:toggle-always-on-top', () => toggleAlwaysOnTop())

  ipcMain.handle('window:toggle-maximize', () => {
    if (!mainWindow) return false
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
    return mainWindow.isMaximized()
  })

  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:hide', () => mainWindow?.hide())
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.novit.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpc()
  createWindow()
  createTray()

  const registered = globalShortcut.register(TOGGLE_HOTKEY, toggleWindow)
  if (!registered) {
    console.warn(`Failed to register global shortcut: ${TOGGLE_HOTKEY}`)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
