import { contextBridge, ipcRenderer } from 'electron'

const api = {
  notes: {
    list: () => ipcRenderer.invoke('notes:list'),
    read: (name) => ipcRenderer.invoke('notes:read', name),
    write: (name, text) => ipcRenderer.invoke('notes:write', name, text),
    create: (name) => ipcRenderer.invoke('notes:create', name),
    rename: (oldName, newName) => ipcRenderer.invoke('notes:rename', oldName, newName),
    delete: (name) => ipcRenderer.invoke('notes:delete', name)
  },
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggle-always-on-top'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  hideWindow: () => ipcRenderer.send('window:hide'),
  onAlwaysOnTopChanged: (callback) => {
    ipcRenderer.on('window:always-on-top-changed', (_event, value) => callback(value))
  },
  onMaximizedChanged: (callback) => {
    ipcRenderer.on('window:maximized-changed', (_event, value) => callback(value))
  },
  onNewNoteRequested: (callback) => {
    ipcRenderer.on('tray:new-note', () => callback())
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('novit', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.novit = api
}
