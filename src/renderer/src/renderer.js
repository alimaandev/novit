import { marked } from 'marked'
import TurndownService from 'turndown'

marked.use({ breaks: true, gfm: true })

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**'
})
turndownService.keep(['span', 'font'])
turndownService.escape = (string) => string
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`
})

const editor = document.getElementById('editor')
const preview = document.getElementById('preview')
const toolbar = document.getElementById('toolbar')
const tabEdit = document.getElementById('tab-edit')
const tabPreview = document.getElementById('tab-preview')
const btnPin = document.getElementById('btn-pin')
const btnMinimize = document.getElementById('btn-minimize')
const btnMaximize = document.getElementById('btn-maximize')
const btnHide = document.getElementById('btn-hide')
const btnNewNote = document.getElementById('btn-new-note')
const noteTitle = document.getElementById('note-title')
const noteSearch = document.getElementById('note-search')
const noteList = document.getElementById('note-list')
const saveStatus = document.getElementById('save-status')
const stats = document.getElementById('stats')
const btnTheme = document.getElementById('btn-theme')
const paletteOverlay = document.getElementById('palette')
const paletteInput = document.getElementById('palette-input')
const paletteResults = document.getElementById('palette-results')

const SAVE_DEBOUNCE_MS = 500
const RENAME_DEBOUNCE_MS = 700
const THEMES = ['olive', 'purple', 'cyan', 'crimson']

const state = {
  notes: [],
  active: null,
  text: '',
  dirty: false,
  saving: false,
  search: ''
}

function setSaveStatus(status) {
  saveStatus.className = status
  saveStatus.lastChild.textContent =
    status === 'saving' ? 'Saving...' : status === 'unsaved' ? 'Unsaved' : 'Saved'
}

function renderPreview() {
  if (!state.text.trim()) {
    preview.innerHTML =
      '<p class="preview-empty">Nothing to preview yet - write something in Edit.</p>'
    return
  }
  preview.innerHTML = marked.parse(state.text)
  const taskLines = []
  state.text.split('\n').forEach((line, index) => {
    const match = line.match(/^\s*[-*+]\s+\[( |x|X)\]\s+/)
    if (match) taskLines.push({ index, checked: match[1].toLowerCase() === 'x' })
  })
  const boxes = [...preview.querySelectorAll('li input[type="checkbox"]')]
  if (boxes.length !== taskLines.length) return
  boxes.forEach((box, i) => {
    box.disabled = false
    box.checked = taskLines[i].checked
    box.addEventListener('click', () => toggleTask(taskLines[i], box))
  })
}

function toggleTask(task, box) {
  const lines = state.text.split('\n')
  const line = lines[task.index]
  const match = line.match(/^(\s*[-*+]\s+\[)( |x|X)(\]\s*.*)$/)
  if (!match) return
  lines[task.index] = `${match[1]}${box.checked ? 'x' : ' '}${match[3]}`
  state.text = lines.join('\n')
  scheduleSave()
  updateStats()
}

function updateStats() {
  const words = state.text.trim() ? state.text.trim().split(/\s+/).length : 0
  stats.textContent = `${state.notes.length} note${state.notes.length === 1 ? '' : 's'} \u00b7 ${words} word${words === 1 ? '' : 's'}`
}

function switchTab(name) {
  const isEdit = name === 'edit'
  tabEdit.classList.toggle('active', isEdit)
  tabPreview.classList.toggle('active', !isEdit)
  toolbar.classList.toggle('hidden', !isEdit)
  editor.classList.toggle('hidden', !isEdit)
  preview.classList.toggle('hidden', isEdit)
  if (isEdit) {
    editor.focus()
  } else {
    renderPreview()
  }
}

async function saveCurrent() {
  if (!state.active || !state.dirty || state.saving) return
  state.saving = true
  setSaveStatus('saving')
  try {
    await window.novit.notes.write(state.active, state.text)
    state.dirty = false
    setSaveStatus('saved')
  } catch (err) {
    console.error('Save failed:', err)
    setSaveStatus('unsaved')
  } finally {
    state.saving = false
  }
}

function scheduleSave() {
  state.dirty = true
  setSaveStatus('unsaved')
  clearTimeout(scheduleSave.timer)
  scheduleSave.timer = setTimeout(saveCurrent, SAVE_DEBOUNCE_MS)
}

function markDirty() {
  state.text = turndownService.turndown(editor.innerHTML)
  updateStats()
  scheduleSave()
}

function sanitizeTitle(name) {
  return [...String(name)]
    .filter((ch) => ch.charCodeAt(0) > 31 && ch.charCodeAt(0) !== 127)
    .join('')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/[.\s]+$/g, '')
    .trim()
}

function renderList() {
  const query = state.search.toLowerCase()
  noteList.innerHTML = ''
  const visible = state.notes.filter((n) => n.name.toLowerCase().includes(query))

  if (visible.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'note-empty'
    empty.textContent = state.notes.length === 0 ? 'No notes yet' : 'No matches'
    noteList.appendChild(empty)
    return
  }

  for (const note of visible) {
    const li = document.createElement('li')
    li.className = 'note-item' + (note.name === state.active ? ' active' : '')
    li.title = note.name

    const name = document.createElement('span')
    name.className = 'note-name'
    name.textContent = note.name
    li.appendChild(name)

    const del = document.createElement('button')
    del.className = 'note-delete'
    del.textContent = '\u00d7'
    del.title = 'Delete note'
    del.addEventListener('click', (event) => {
      event.stopPropagation()
      deleteNote(note.name)
    })
    li.appendChild(del)

    li.addEventListener('click', () => openNote(note.name))
    noteList.appendChild(li)
  }
}

async function refreshList() {
  state.notes = await window.novit.notes.list()
  renderList()
  updateStats()
}

async function openNote(name) {
  if (state.dirty) await saveCurrent()
  state.active = name
  state.text = await window.novit.notes.read(name)
  state.dirty = false
  editor.innerHTML = state.text ? marked.parse(state.text) : ''
  noteTitle.value = name
  renderList()
  updateStats()
  if (editor.classList.contains('hidden')) renderPreview()
  editor.focus()
}

async function createNote() {
  let name = 'Untitled'
  let i = 1
  const taken = new Set(state.notes.map((n) => n.name))
  while (taken.has(name)) name = `Untitled ${++i}`
  await window.novit.notes.create(name)
  await refreshList()
  await openNote(name)
}

async function deleteNote(name) {
  const shouldDelete = window.confirm(`Delete note "${name}"?`)
  if (!shouldDelete) return
  await window.novit.notes.delete(name)
  const remaining = state.notes.filter((n) => n.name !== name)
  if (name === state.active) {
    state.active = null
    state.text = ''
    state.dirty = false
    editor.innerHTML = ''
    noteTitle.value = ''
  }
  await refreshList()
  if (!state.active && remaining.length > 0) {
    await openNote(remaining[0].name)
  }
}

async function renameActive(next) {
  const clean = sanitizeTitle(next)
  if (!clean || clean === state.active || !state.active) return
  try {
    const finalName = await window.novit.notes.rename(state.active, clean)
    state.active = finalName
    noteTitle.value = finalName
    await refreshList()
  } catch (err) {
    console.error('Rename failed:', err)
  }
}

function execFmt(command, value = null) {
  document.execCommand(command, false, value)
  markDirty()
  editor.focus()
}

function wrapInlineCode() {
  const selection = window.getSelection()
  if (!selection.rangeCount) return
  const range = selection.getRangeAt(0)
  const code = document.createElement('code')
  try {
    if (range.collapsed) {
      code.textContent = 'code'
      range.insertNode(code)
    } else {
      range.surroundContents(code)
    }
  } catch {
    document.execCommand('insertHTML', false, '<code>code</code>')
  }
  markDirty()
  editor.focus()
}

function applyLink() {
  const url = window.prompt('Link URL:', 'https://')
  if (!url) return
  document.execCommand('createLink', false, url)
  markDirty()
  editor.focus()
}

function wireToolbar() {
  const actions = {
    'btn-bold': () => execFmt('bold'),
    'btn-italic': () => execFmt('italic'),
    'btn-strike': () => execFmt('strikeThrough'),
    'btn-h1': () => execFmt('formatBlock', 'h1'),
    'btn-h2': () => execFmt('formatBlock', 'h2'),
    'btn-h3': () => execFmt('formatBlock', 'h3'),
    'btn-ul': () => execFmt('insertUnorderedList'),
    'btn-ol': () => execFmt('insertOrderedList'),
    'btn-quote': () => execFmt('formatBlock', 'blockquote'),
    'btn-code': () => wrapInlineCode(),
    'btn-link': () => applyLink()
  }
  for (const [id, action] of Object.entries(actions)) {
    document.getElementById(id).addEventListener('click', action)
  }

  const colorInput = document.getElementById('btn-color')
  colorInput.addEventListener('input', () => {
    execFmt('foreColor', colorInput.value)
  })

  const sizeSelect = document.getElementById('btn-size')
  sizeSelect.addEventListener('change', () => {
    if (!sizeSelect.value) return
    execFmt('fontSize', sizeSelect.value)
    sizeSelect.value = ''
  })
}

function applyTheme(name) {
  document.documentElement.dataset.theme = name
  localStorage.setItem('novit:theme', name)
}

function cycleTheme() {
  const current = document.documentElement.dataset.theme || 'olive'
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]
  applyTheme(next)
}

let paletteItems = []
let paletteActive = 0

function openPalette() {
  paletteOverlay.classList.remove('hidden')
  paletteInput.value = ''
  filterPalette('')
  paletteInput.focus()
}

function closePalette() {
  paletteOverlay.classList.add('hidden')
  editor.focus()
}

function runPaletteItem(item) {
  closePalette()
  item.action()
}

function renderPalette() {
  paletteResults.innerHTML = ''
  if (paletteItems.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'palette-empty'
    empty.textContent = 'No matches'
    paletteResults.appendChild(empty)
    return
  }
  paletteItems.forEach((item, index) => {
    const li = document.createElement('li')
    li.className = 'palette-item' + (index === paletteActive ? ' active' : '')
    const name = document.createElement('span')
    name.textContent = item.label
    const hint = document.createElement('span')
    hint.className = 'palette-hint'
    hint.textContent = item.hint
    li.append(name, hint)
    li.addEventListener('mousedown', () => runPaletteItem(item))
    li.addEventListener('mousemove', () => {
      paletteActive = index
      renderPalette()
    })
    paletteResults.appendChild(li)
  })
}

function filterPalette(query) {
  const q = query.toLowerCase()
  const isEditTab = tabEdit.classList.contains('active')
  const candidates = [
    { label: 'New note', hint: 'Ctrl+N', action: () => createNote() },
    {
      label: isEditTab ? 'Switch to Preview' : 'Switch to Edit',
      hint: 'Tab',
      action: () => switchTab(isEditTab ? 'preview' : 'edit')
    },
    { label: 'Toggle always on top', hint: 'Pin', action: () => btnPin.click() },
    {
      label: `Theme: ${THEMES[(THEMES.indexOf(document.documentElement.dataset.theme || 'olive') + 1) % THEMES.length]}`,
      hint: 'Palette',
      action: () => cycleTheme()
    },
    ...state.notes.map((n) => ({
      label: n.name,
      hint: 'Note',
      action: () => openNote(n.name)
    }))
  ]
  paletteItems = candidates.filter((i) => !q || i.label.toLowerCase().includes(q))
  paletteActive = 0
  renderPalette()
}

function wirePalette() {
  paletteInput.addEventListener('input', () => filterPalette(paletteInput.value))
  paletteInput.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      paletteActive = (paletteActive + 1) % paletteItems.length
      renderPalette()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      paletteActive = (paletteActive - 1 + paletteItems.length) % paletteItems.length
      renderPalette()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (paletteItems[paletteActive]) runPaletteItem(paletteItems[paletteActive])
    } else if (event.key === 'Escape') {
      closePalette()
    }
  })
  paletteOverlay.addEventListener('mousedown', (event) => {
    if (event.target === paletteOverlay) closePalette()
  })
}

async function init() {
  applyTheme(localStorage.getItem('novit:theme') || 'olive')
  await refreshList()
  if (state.notes.length > 0) {
    await openNote(state.notes[0].name)
  }

  editor.addEventListener('input', markDirty)

  editor.addEventListener('paste', (event) => {
    event.preventDefault()
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
  })

  noteTitle.addEventListener('input', () => {
    clearTimeout(noteTitle.timer)
    noteTitle.timer = setTimeout(() => renameActive(noteTitle.value), RENAME_DEBOUNCE_MS)
  })

  noteSearch.addEventListener('input', () => {
    state.search = noteSearch.value
    renderList()
  })

  tabEdit.addEventListener('click', () => switchTab('edit'))
  tabPreview.addEventListener('click', () => switchTab('preview'))
  btnNewNote.addEventListener('click', createNote)
  wireToolbar()

  btnPin.addEventListener('click', async () => {
    const isPinned = await window.novit.toggleAlwaysOnTop()
    btnPin.classList.toggle('active', isPinned)
  })

  btnMaximize.addEventListener('click', async () => {
    const isMaximized = await window.novit.toggleMaximize()
    btnMaximize.classList.toggle('maximized', isMaximized)
  })

  btnMinimize.addEventListener('click', () => window.novit.minimizeWindow())
  btnHide.addEventListener('click', () => window.novit.hideWindow())
  btnTheme.addEventListener('click', cycleTheme)
  wirePalette()

  window.novit.onNewNoteRequested(() => createNote())

  window.novit.onAlwaysOnTopChanged((isPinned) => {
    btnPin.classList.toggle('active', isPinned)
  })

  window.novit.onMaximizedChanged((isMaximized) => {
    btnMaximize.classList.toggle('maximized', isMaximized)
  })

  window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (paletteOverlay.classList.contains('hidden')) {
        openPalette()
      } else {
        closePalette()
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
      event.preventDefault()
      createNote()
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(scheduleSave.timer)
      saveCurrent()
    }
  })
}

init()
