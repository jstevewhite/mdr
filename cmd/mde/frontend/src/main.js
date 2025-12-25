import './style.css'
import './app.css'
import {
    createEditor,
    setEditorContent,
    getEditorContent,
    insertAtCursor,
    wrapSelection,
    setFontScale
} from './editor.js'

let editorView
let currentPath = ''
let isDirty = false
let fontScale = 100

// Initialize editor
window.addEventListener('DOMContentLoaded', async () => {
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
        const theme = await window.go.main.App.GetTheme()
        const palette = await window.go.main.App.GetPalette()
        fontScale = await window.go.main.App.GetFontScale()

        document.getElementById('theme-select').value = theme
        document.getElementById('palette-select').value = palette
        document.body.className = `palette-${palette}`
        setFontScale(editorView, fontScale)
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
        select.value = current
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
    }
}

async function saveFile() {
    try {
        const content = getEditorContent(editorView)
        await window.go.main.App.SaveFile(content)
        setDirty(false)
    } catch (err) {
        console.error('Failed to save file:', err)
        alert('Failed to save file: ' + err)
    }
}

async function openPreview() {
    try {
        // Save first if dirty
        if (isDirty) {
            await saveFile()
        }
        await window.go.main.App.OpenInPreview()
    } catch (err) {
        console.error('Failed to open preview:', err)
        alert('Failed to open preview. Make sure MDR is installed.')
    }
}

async function changeTheme(e) {
    try {
        await window.go.main.App.SetTheme(e.target.value)
    } catch (err) {
        console.error('Failed to change theme:', err)
    }
}

async function changePalette(e) {
    try {
        await window.go.main.App.SetPalette(e.target.value)
        document.body.className = `palette-${e.target.value}`
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
