import './style.css'
import './app.css'
import {
    createEditor,
    setEditorContent,
    getEditorContent,
    insertAtCursor,
    wrapSelection,
    setFontScale,
    setTheme
} from './editor.js'

// Defensive: handle accidental duplicate inclusion (e.g. both dev + built assets wired)
window.__mde_initialized = window.__mde_initialized || 0
window.__mde_initialized += 1

// Ensure init + dialogs are guarded *globally* (so it works even if this file is evaluated twice)
window.__mde_booted = window.__mde_booted || false
window.__mde_dialog_busy = window.__mde_dialog_busy || false

function dialogTryLock() {
    if (window.__mde_dialog_busy) return false
    window.__mde_dialog_busy = true
    return true
}

function dialogUnlock() {
    window.__mde_dialog_busy = false
}

let editorView
let currentPath = ''
let isDirty = false
let fontScale = 100
let currentTheme = 'default'
let currentPalette = 'dark'

// Initialize editor
window.addEventListener('DOMContentLoaded', async () => {
    // If this script is loaded twice, only the first instance should wire UI events.
    if (window.__mde_booted) {
        console.warn('mde already booted; skipping duplicate DOMContentLoaded init')
        return
    }
    window.__mde_booted = true

    // Create editor
    const container = document.getElementById('editor-container')
    editorView = createEditor(container, '', {
        onChange: handleContentChange,
        onCursorChange: updateCursorPosition
    })

    // Load settings
    await loadSettings()

    // Wire up buttons
    setupToolbar()
    setupKeyboardShortcuts()

    // Load themes
    await loadThemes()

    // Check for launch args
    setTimeout(checkLaunchArgs, 100)
})

async function checkLaunchArgs() {
    try {
        const args = await window.go.main.App.GetLaunchArgs()
        if (args && args.length > 0) {
            const filePath = args[0]
            await openSpecificFile(filePath)
        }
    } catch (err) {
        console.log('No launch args')
    }
}

async function openSpecificFile(path) {
    try {
        const content = await window.go.main.App.OpenFile()
        if (content) {
            setEditorContent(editorView, content)
            currentPath = await window.go.main.App.GetCurrentPath()
            updateStatusFile()
            setDirty(false)
        }
    } catch (err) {
        console.error('Failed to open file:', err)
    }
}

async function loadSettings() {
    try {
        currentTheme = await window.go.main.App.GetTheme()
        currentPalette = await window.go.main.App.GetPalette()
        fontScale = await window.go.main.App.GetFontScale()

        document.getElementById('theme-select').value = currentTheme
        document.getElementById('palette-select').value = currentPalette
        document.body.className = `palette-${currentPalette}`
        setFontScale(editorView, fontScale)
        setTheme(editorView, currentTheme, currentPalette)
    } catch (err) {
        console.error('Failed to load settings:', err)
    }
}

async function loadThemes() {
    try {
        const themes = await window.go.main.App.ListThemes()
        const select = document.getElementById('theme-select')
        select.innerHTML = themes.map(t =>
            `<option value="${t}">${t}</option>`
        ).join('')

        const current = await window.go.main.App.GetTheme()
        currentTheme = current || 'default'
        select.value = currentTheme
        setTheme(editorView, currentTheme, currentPalette)
    } catch (err) {
        console.error('Failed to load themes:', err)
    }
}

function setupToolbar() {
    // File operations
    document.getElementById('btn-open').addEventListener('click', openFile)
    document.getElementById('btn-save').addEventListener('click', saveFile)
    document.getElementById('btn-preview').addEventListener('click', openPreview)

    // Formatting
    document.getElementById('btn-h1').addEventListener('click', () => insertAtCursor(editorView, '# '))
    document.getElementById('btn-h2').addEventListener('click', () => insertAtCursor(editorView, '## '))
    document.getElementById('btn-h3').addEventListener('click', () => insertAtCursor(editorView, '### '))
    document.getElementById('btn-bold').addEventListener('click', () => wrapSelection(editorView, '**', '**'))
    document.getElementById('btn-italic').addEventListener('click', () => wrapSelection(editorView, '*', '*'))
    document.getElementById('btn-code').addEventListener('click', () => wrapSelection(editorView, '`', '`'))
    document.getElementById('btn-list').addEventListener('click', () => insertAtCursor(editorView, '- '))
    document.getElementById('btn-numlist').addEventListener('click', () => insertAtCursor(editorView, '1. '))
    document.getElementById('btn-quote').addEventListener('click', () => insertAtCursor(editorView, '> '))
    document.getElementById('btn-link').addEventListener('click', insertLink)

    // Theme
    document.getElementById('theme-select').addEventListener('change', changeTheme)
    document.getElementById('palette-select').addEventListener('change', changePalette)

    // Font
    document.getElementById('font-increase').addEventListener('click', () => adjustFont(10))
    document.getElementById('font-decrease').addEventListener('click', () => adjustFont(-10))
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'o': e.preventDefault(); openFile(); break
                case 's': e.preventDefault(); saveFile(); break
                case 'p': e.preventDefault(); openPreview(); break
                case 'b': e.preventDefault(); wrapSelection(editorView, '**', '**'); break
                case 'i': e.preventDefault(); wrapSelection(editorView, '*', '*'); break
                case 'k': e.preventDefault(); insertLink(); break
                case '`': e.preventDefault(); wrapSelection(editorView, '`', '`'); break
            }
        }
    })
}

async function openFile() {
    if (!dialogTryLock()) return
    try {
        const content = await window.go.main.App.OpenFile()
        if (content !== null && content !== undefined) {
            setEditorContent(editorView, content)
            currentPath = await window.go.main.App.GetCurrentPath()
            updateStatusFile()
            setDirty(false)
        }
    } catch (err) {
        console.error('Failed to open file:', err)
    } finally {
        dialogUnlock()
    }
}

async function saveFile() {
    if (!dialogTryLock()) return
    try {
        const content = getEditorContent(editorView)

        // If we don't have a path yet, treat Save as Save As.
        const path = await window.go.main.App.GetCurrentPath()
        if (!path) {
            await window.go.main.App.SaveFileAs(content)
            currentPath = await window.go.main.App.GetCurrentPath()
            updateStatusFile()
        } else {
            await window.go.main.App.SaveFile(content)
        }

        setDirty(false)
    } catch (err) {
        console.error('Failed to save file:', err)
        alert('Failed to save file: ' + err)
    } finally {
        dialogUnlock()
    }
}

async function openPreview() {
    // Preview can call saveFile() first; don't take the lock until we actually launch preview.
    try {
        if (isDirty) {
            await saveFile()
        }

        if (!dialogTryLock()) return
        await window.go.main.App.OpenInPreview()
    } catch (err) {
        console.error('Failed to open preview:', err)
        alert('Failed to open preview. Make sure MDR is installed.')
    } finally {
        dialogUnlock()
    }
}

async function changeTheme(e) {
    try {
        currentTheme = e.target.value || 'default'
        await window.go.main.App.SetTheme(currentTheme)
        setTheme(editorView, currentTheme, currentPalette)
    } catch (err) {
        console.error('Failed to change theme:', err)
    }
}

async function changePalette(e) {
    try {
        currentPalette = e.target.value || 'dark'
        await window.go.main.App.SetPalette(currentPalette)
        document.body.className = `palette-${currentPalette}`
        setTheme(editorView, currentTheme, currentPalette)
    } catch (err) {
        console.error('Failed to change palette:', err)
    }
}

async function adjustFont(delta) {
    fontScale = Math.max(50, Math.min(200, fontScale + delta))
    setFontScale(editorView, fontScale)
    try {
        await window.go.main.App.SetFontScale(fontScale)
    } catch (err) {
        console.error('Failed to save font scale:', err)
    }
}

function insertLink() {
    const url = prompt('Enter URL:')
    if (url) {
        wrapSelection(editorView, '[', `](${url})`)
    }
}

function handleContentChange(content) {
    setDirty(true)
}

function updateCursorPosition({ line, col, chars }) {
    document.getElementById('status-position').textContent = `Line ${line}, Col ${col}`
    document.getElementById('status-chars').textContent = `${chars} characters`
}

function setDirty(dirty) {
    isDirty = dirty
    document.getElementById('status-dirty').style.display = dirty ? 'inline' : 'none'
    try {
        window.go.main.App.SetDirty(dirty)
    } catch (err) {
        // Ignore if backend not ready
    }
}

function updateStatusFile() {
    const filename = currentPath.split('/').pop() || currentPath.split('\\').pop() || 'No file open'
    document.getElementById('status-file').textContent = filename
}
