# MDE Implementation Plan

**Markdown Editor (mde) - Companion to MDR**

## Overview

Create a companion markdown editor (mde) that shares infrastructure with the existing markdown reader (mdr). The two applications will work together as a unified markdown workflow:

- **mdr** (existing): Markdown viewer/reader with preview
- **mde** (new): Markdown editor with syntax highlighting

### Key Principles

1. **Shared Infrastructure**: Both apps use the same config, themes, and core libraries
2. **Bidirectional Integration**: mdr ↔️ mde round-trip editing
3. **Consistent UX**: Identical look, feel, and theme system
4. **Single Repository**: Two build targets from one codebase

---

## Architecture

### Project Structure

```
mdr/  (repository root)
├── cmd/
│   ├── mdr/                    # Viewer application
│   │   ├── main.go             # Viewer entry point
│   │   ├── wails.json          # Wails config for viewer
│   │   └── frontend/           # Viewer UI
│   │       ├── package.json
│   │       ├── index.html
│   │       ├── vite.config.js
│   │       └── src/
│   │           ├── main.js     # Preview logic
│   │           ├── app.css
│   │           └── style.css
│   │
│   └── mde/                    # Editor application
│       ├── main.go             # Editor entry point
│       ├── wails.json          # Wails config for editor
│       └── frontend/           # Editor UI
│           ├── package.json
│           ├── index.html
│           ├── vite.config.js
│           └── src/
│               ├── main.js     # Editor logic + CodeMirror
│               ├── app.css     # Same styling as mdr
│               └── style.css
│
├── internal/                   # Shared internal packages
│   ├── config/
│   │   └── config.go          # Shared configuration system
│   ├── theme/
│   │   └── theme.go           # Shared theme loading/management
│   ├── files/
│   │   └── files.go           # Shared file operations
│   └── models/
│       └── models.go          # Shared data structures
│
├── pkg/                        # Public shared packages
│   └── markdown/
│       └── parser.go          # Shared markdown utilities
│
├── build/                      # Build outputs
│   ├── bin/
│   │   ├── mdr                # Viewer binary
│   │   └── mde                # Editor binary
│   └── dist/
│
├── go.mod
├── go.sum
├── Makefile                    # Build targets for both apps
└── README.md
```

---

## Phase 1: Refactor Existing MDR

### 1.1 Restructure Project Layout

**Goal**: Move current mdr code into `cmd/mdr/` structure

**Tasks**:
- [ ] Create `cmd/mdr/` directory
- [ ] Move `main.go` → `cmd/mdr/main.go`
- [ ] Move `wails.json` → `cmd/mdr/wails.json`
- [ ] Move `frontend/` → `cmd/mdr/frontend/`
- [ ] Update import paths in `cmd/mdr/main.go`
- [ ] Update `wails.json` frontend path references

**Files affected**:
- `/mnt/sam990/stwhite/mdr/main.go`
- `/mnt/sam990/stwhite/mdr/wails.json`
- `/mnt/sam990/stwhite/mdr/frontend/*`

### 1.2 Extract Shared Configuration

**Goal**: Move config logic to `internal/config/`

**Tasks**:
- [ ] Create `internal/config/config.go`
- [ ] Move config struct from `config.go` to `internal/config/config.go`
- [ ] Move config file I/O functions
- [ ] Export public types and functions
- [ ] Update `app.go` to import `internal/config`
- [ ] Test config loading/saving works

**Code to extract** from `/mnt/sam990/stwhite/mdr/config.go`:
```go
package config

type Config struct {
    Theme          string
    Palette        string
    FontScale      int
    AutoReload     bool
    TOCVisible     bool
    TOCPinned      bool
    LastOpenedFile string
}

func Load() (*Config, error)
func (c *Config) Save() error
func (c *Config) Get(key string) string
func (c *Config) Set(key, value string) error
func GetConfigDir() string
```

### 1.3 Extract Shared Theme System

**Goal**: Move theme logic to `internal/theme/`

**Tasks**:
- [ ] Create `internal/theme/theme.go`
- [ ] Extract theme loading from `renderer.go:92-118`
- [ ] Extract palette CSS generation from `renderer.go:81-90`
- [ ] Create theme listing function
- [ ] Create theme file watcher
- [ ] Update `app.go` and `renderer.go` to use `internal/theme`

**Code to extract**:
```go
package theme

type Theme struct {
    Name      string
    CSS       string
    IsCustom  bool
}

type Palette string

const (
    PaletteLight Palette = "light"
    PaletteDark  Palette = "dark"
    PaletteTheme Palette = "theme"
)

func LoadTheme(name string) (*Theme, error)
func ListThemes() ([]Theme, error)
func GetPaletteCSS(palette Palette) string
func WatchThemeFile(name string, callback func()) error
func GetThemeDir() string
```

### 1.4 Extract Shared File Operations

**Goal**: Move file ops to `internal/files/`

**Tasks**:
- [ ] Create `internal/files/files.go`
- [ ] Extract file reading/writing utilities
- [ ] Extract file watching logic from `app.go`
- [ ] Create file dialog wrappers
- [ ] Update `app.go` to use `internal/files`

**Code to extract**:
```go
package files

import "github.com/fsnotify/fsnotify"

type Watcher struct {
    watcher  *fsnotify.Watcher
    callback func(string)
}

func ReadFile(path string) (string, error)
func WriteFile(path string, content string) error
func WatchFile(path string, callback func(string)) (*Watcher, error)
func (w *Watcher) Stop() error
```

### 1.5 Create Viewer App Package

**Goal**: Encapsulate viewer-specific logic

**Tasks**:
- [ ] Create `internal/app/viewer.go`
- [ ] Move viewer-specific methods from `app.go`
- [ ] Keep renderer.go in cmd/mdr/ (viewer-specific)
- [ ] Update `cmd/mdr/main.go` to use `internal/app.NewViewer()`

**Structure**:
```go
package app

import (
    "yourrepo/internal/config"
    "yourrepo/internal/theme"
    "yourrepo/internal/files"
)

type Viewer struct {
    config      *config.Config
    theme       *theme.Theme
    currentPath string
    fileWatcher *files.Watcher
    renderer    *Renderer
}

func NewViewer(cfg *config.Config) *Viewer

// Existing methods
func (v *Viewer) RenderFile(path string) (string, error)
func (v *Viewer) RenderFileWithPaletteAndTOC(path, palette string, includeTOC bool) (string, error)
func (v *Viewer) OpenAndRender() (string, error)
func (v *Viewer) GetTheme() string
func (v *Viewer) SetTheme(name string) error
func (v *Viewer) GetPalette() string
func (v *Viewer) SetPalette(mode string) error
func (v *Viewer) SearchDocument(query string, caseSensitive bool) ([]SearchResult, error)

// NEW: Launch editor
func (v *Viewer) OpenInEditor() error
```

### 1.6 Update Build System

**Tasks**:
- [ ] Update `Makefile` for new structure
- [ ] Test build process: `make mdr`
- [ ] Test dev mode: `make dev-mdr`
- [ ] Verify binary output to `build/bin/mdr`
- [ ] Test that all existing functionality works

**Makefile**:
```makefile
.PHONY: all mdr mde clean dev-mdr dev-mde

all: mdr mde

mdr:
	cd cmd/mdr && wails build -o ../../build/bin/

mde:
	cd cmd/mde && wails build -o ../../build/bin/

dev-mdr:
	cd cmd/mdr && wails dev

dev-mde:
	cd cmd/mde && wails dev

clean:
	rm -rf build/bin/* cmd/mdr/build cmd/mde/build
	rm -rf cmd/mdr/frontend/dist cmd/mde/frontend/dist

install:
	cp build/bin/mdr $(HOME)/.local/bin/
	cp build/bin/mde $(HOME)/.local/bin/
```

---

## Phase 2: Create MDE Editor

### 2.1 Create MDE Project Structure

**Tasks**:
- [ ] Create `cmd/mde/` directory structure
- [ ] Copy `cmd/mdr/main.go` → `cmd/mde/main.go` as template
- [ ] Copy `cmd/mdr/wails.json` → `cmd/mde/wails.json`
- [ ] Copy `cmd/mdr/frontend/` → `cmd/mde/frontend/`
- [ ] Update `cmd/mde/wails.json`:
  - Change name: "mde"
  - Change title: "MDE - Markdown Editor"
  - Update frontend path
- [ ] Update `cmd/mde/frontend/package.json` name to "mde-frontend"

### 2.2 Create Editor App Package

**Goal**: Create editor-specific backend logic

**Tasks**:
- [ ] Create `internal/app/editor.go`
- [ ] Implement editor struct and methods
- [ ] Update `cmd/mde/main.go` to use `internal/app.NewEditor()`

**Structure** (`internal/app/editor.go`):
```go
package app

import (
    "context"
    "os/exec"
    "yourrepo/internal/config"
    "yourrepo/internal/theme"
    "yourrepo/internal/files"
)

type Editor struct {
    ctx         context.Context
    config      *config.Config
    theme       *theme.Theme
    currentPath string
    isDirty     bool
    fileWatcher *files.Watcher
}

func NewEditor(cfg *config.Config) *Editor

// File operations
func (e *Editor) OpenFile(path string) (string, error)
func (e *Editor) SaveFile(content string) error
func (e *Editor) SaveFileAs(path, content string) error
func (e *Editor) GetCurrentPath() string
func (e *Editor) SetDirty(dirty bool)
func (e *Editor) IsDirty() bool

// Theme operations (inherited from shared)
func (e *Editor) GetTheme() string
func (e *Editor) SetTheme(name string) error
func (e *Editor) GetPalette() string
func (e *Editor) SetPalette(mode string) error
func (e *Editor) ListThemes() ([]string, error)

// Font operations (inherited from shared)
func (e *Editor) GetFontScale() int
func (e *Editor) SetFontScale(scale int) error

// NEW: Launch preview
func (e *Editor) OpenInPreview() error {
    if e.currentPath == "" {
        return errors.New("no file open")
    }
    cmd := exec.Command("mdr", e.currentPath)
    return cmd.Start()
}

// NEW: Editor-specific features
func (e *Editor) InsertMarkdown(syntax string, position int) error
func (e *Editor) WrapSelection(before, after string, start, end int) error
```

**Implementation** (`cmd/mde/main.go`):
```go
package main

import (
    "embed"
    "github.com/wailsapp/wails/v2"
    "github.com/wailsapp/wails/v2/pkg/options"
    "yourrepo/internal/app"
    "yourrepo/internal/config"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
    cfg, err := config.Load()
    if err != nil {
        cfg = config.NewDefault()
    }

    editor := app.NewEditor(cfg)

    err = wails.Run(&options.App{
        Title:  "MDE - Markdown Editor",
        Width:  1024,
        Height: 768,
        Assets: assets,
        Bind: []interface{}{
            editor,
        },
        OnStartup:  editor.Startup,
        OnShutdown: editor.Shutdown,
    })

    if err != nil {
        panic(err)
    }
}
```

### 2.3 Install CodeMirror Dependencies

**Tasks**:
- [ ] `cd cmd/mde/frontend`
- [ ] `npm install codemirror @codemirror/state @codemirror/view`
- [ ] `npm install @codemirror/lang-markdown`
- [ ] `npm install @codemirror/commands`
- [ ] `npm install @codemirror/search`
- [ ] `npm install @codemirror/autocomplete`
- [ ] Update `package.json` with new deps

**Expected package.json additions**:
```json
{
  "dependencies": {
    "codemirror": "^6.0.1",
    "@codemirror/state": "^6.4.0",
    "@codemirror/view": "^6.23.0",
    "@codemirror/lang-markdown": "^6.2.4",
    "@codemirror/commands": "^6.3.3",
    "@codemirror/search": "^6.5.5",
    "@codemirror/autocomplete": "^6.12.0"
  }
}
```

### 2.4 Create Editor Frontend UI

**Goal**: Build editor interface matching mdr's look

**Tasks**:
- [ ] Update `cmd/mde/frontend/index.html`
- [ ] Update `cmd/mde/frontend/src/app.css`
- [ ] Create `cmd/mde/frontend/src/editor.js` (CodeMirror setup)
- [ ] Update `cmd/mde/frontend/src/main.js`

**HTML Structure** (`cmd/mde/frontend/index.html`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MDE - Markdown Editor</title>
</head>
<body>
    <div id="app">
        <!-- Header toolbar (matches mdr) -->
        <div class="toolbar">
            <div class="toolbar-left">
                <button id="btn-open" title="Open File (Ctrl+O)">📂 Open</button>
                <button id="btn-save" title="Save (Ctrl+S)">💾 Save</button>
                <button id="btn-preview" title="Preview in MDR (Ctrl+P)">👁️ Preview</button>
            </div>

            <div class="toolbar-center">
                <!-- Formatting buttons -->
                <button id="btn-h1" title="Heading 1"># H1</button>
                <button id="btn-h2" title="Heading 2">## H2</button>
                <button id="btn-h3" title="Heading 3">### H3</button>
                <span class="separator">|</span>
                <button id="btn-bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
                <button id="btn-italic" title="Italic (Ctrl+I)"><em>I</em></button>
                <button id="btn-code" title="Code (Ctrl+`)">` Code</button>
                <span class="separator">|</span>
                <button id="btn-list" title="Bullet List">• List</button>
                <button id="btn-numlist" title="Numbered List">1. List</button>
                <button id="btn-quote" title="Blockquote">&gt; Quote</button>
                <span class="separator">|</span>
                <button id="btn-link" title="Link (Ctrl+K)">🔗 Link</button>
                <button id="btn-image" title="Image">🖼️ Image</button>
            </div>

            <div class="toolbar-right">
                <select id="theme-select" title="Theme"></select>
                <select id="palette-select" title="Color Palette">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="theme">System</option>
                </select>
                <button id="font-decrease" title="Decrease Font">A-</button>
                <button id="font-increase" title="Increase Font">A+</button>
            </div>
        </div>

        <!-- Editor container -->
        <div id="editor-container"></div>

        <!-- Status bar (matches mdr) -->
        <div class="status-bar">
            <div class="status-left">
                <span id="status-file">No file open</span>
                <span id="status-dirty" style="display:none;">●</span>
            </div>
            <div class="status-right">
                <span id="status-position">Line 1, Col 1</span>
                <span id="status-chars">0 characters</span>
            </div>
        </div>
    </div>

    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**CSS Updates** (`cmd/mde/frontend/src/app.css`):
```css
/* Copy toolbar and status bar styles from mdr */
/* Add editor-specific styles */

#editor-container {
    flex: 1;
    overflow: auto;
    position: relative;
}

.cm-editor {
    height: 100%;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: calc(14px * var(--font-scale, 1));
}

.cm-scroller {
    font-family: inherit;
}

.toolbar-center {
    display: flex;
    gap: 4px;
    align-items: center;
}

.toolbar-center .separator {
    color: var(--border-color, #ccc);
    margin: 0 4px;
}

#status-dirty {
    color: var(--accent-color, #ff6b6b);
    font-weight: bold;
    margin-left: 8px;
}
```

### 2.5 Implement CodeMirror Integration

**Goal**: Create CodeMirror editor with mdr's theme system

**Tasks**:
- [ ] Create `cmd/mde/frontend/src/editor.js`
- [ ] Implement theme adapter (CSS variables → CodeMirror theme)
- [ ] Set up markdown language support
- [ ] Configure editor extensions

**CodeMirror Setup** (`cmd/mde/frontend/src/editor.js`):
```javascript
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'

// Theme that uses mdr's CSS variables
const mdrTheme = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
    },
    ".cm-content": {
        caretColor: "var(--accent-color)",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "var(--accent-color)",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "var(--selection-bg, rgba(128, 203, 196, 0.2))",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "var(--selection-bg, rgba(128, 203, 196, 0.3))",
    },
    ".cm-activeLine": {
        backgroundColor: "var(--active-line-bg, rgba(128, 128, 128, 0.1))",
    },
    ".cm-gutters": {
        backgroundColor: "var(--code-bg)",
        color: "var(--text-color-muted, #888)",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "var(--active-line-bg, rgba(128, 128, 128, 0.1))",
    },
    // Markdown syntax highlighting using CSS variables
    ".cm-header": {
        color: "var(--accent-color)",
        fontWeight: "bold",
    },
    ".cm-strong": {
        fontWeight: "bold",
    },
    ".cm-em": {
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "var(--link-color)",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "var(--code-bg)",
        color: "var(--code-color, inherit)",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "var(--quote-color, #888)",
        fontStyle: "italic",
    },
}, { dark: false })

// Font scale compartment for dynamic resizing
let fontScaleCompartment = new Compartment()

export function createEditor(parent, content = '', callbacks = {}) {
    const state = EditorState.create({
        doc: content,
        extensions: [
            basicSetup,
            markdown(),
            mdrTheme,
            fontScaleCompartment.of([]),
            history(),
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                ...searchKeymap,
            ]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged && callbacks.onChange) {
                    callbacks.onChange(update.state.doc.toString())
                }
                if (update.selectionSet && callbacks.onCursorChange) {
                    const pos = update.state.selection.main.head
                    const line = update.state.doc.lineAt(pos)
                    callbacks.onCursorChange({
                        line: line.number,
                        col: pos - line.from + 1,
                        chars: update.state.doc.length
                    })
                }
            })
        ]
    })

    const view = new EditorView({
        state,
        parent
    })

    return view
}

export function setEditorContent(view, content) {
    view.dispatch({
        changes: {
            from: 0,
            to: view.state.doc.length,
            insert: content
        }
    })
}

export function getEditorContent(view) {
    return view.state.doc.toString()
}

export function insertAtCursor(view, text) {
    const pos = view.state.selection.main.head
    view.dispatch({
        changes: { from: pos, insert: text },
        selection: { anchor: pos + text.length }
    })
    view.focus()
}

export function wrapSelection(view, before, after) {
    const sel = view.state.selection.main
    const text = view.state.sliceDoc(sel.from, sel.to)

    if (text.length === 0) {
        // No selection, insert markers and place cursor between them
        view.dispatch({
            changes: { from: sel.from, insert: before + after },
            selection: { anchor: sel.from + before.length }
        })
    } else {
        // Wrap selection
        view.dispatch({
            changes: { from: sel.from, to: sel.to, insert: before + text + after },
            selection: {
                anchor: sel.from + before.length,
                head: sel.from + before.length + text.length
            }
        })
    }
    view.focus()
}

export function setFontScale(view, scale) {
    // Update CSS variable
    document.documentElement.style.setProperty('--font-scale', scale / 100)
}
```

### 2.6 Implement Main Editor Logic

**Goal**: Wire up UI controls to CodeMirror

**Tasks**:
- [ ] Update `cmd/mde/frontend/src/main.js`
- [ ] Initialize CodeMirror
- [ ] Wire up toolbar buttons
- [ ] Implement keyboard shortcuts
- [ ] Handle theme switching
- [ ] Implement save/open functionality

**Main Logic** (`cmd/mde/frontend/src/main.js`):
```javascript
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
})

async function loadSettings() {
    try {
        const theme = await window.go.app.Editor.GetTheme()
        const palette = await window.go.app.Editor.GetPalette()
        fontScale = await window.go.app.Editor.GetFontScale()

        document.getElementById('theme-select').value = theme
        document.getElementById('palette-select').value = palette
        setFontScale(editorView, fontScale)
    } catch (err) {
        console.error('Failed to load settings:', err)
    }
}

async function loadThemes() {
    try {
        const themes = await window.go.app.Editor.ListThemes()
        const select = document.getElementById('theme-select')
        select.innerHTML = themes.map(t =>
            `<option value="${t}">${t}</option>`
        ).join('')

        const current = await window.go.app.Editor.GetTheme()
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
    document.getElementById('btn-image').addEventListener('click', insertImage)

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
        const content = await window.go.app.Editor.OpenFile()
        setEditorContent(editorView, content)
        currentPath = await window.go.app.Editor.GetCurrentPath()
        updateStatusFile()
        setDirty(false)
    } catch (err) {
        console.error('Failed to open file:', err)
    }
}

async function saveFile() {
    try {
        const content = getEditorContent(editorView)
        await window.go.app.Editor.SaveFile(content)
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
        await window.go.app.Editor.OpenInPreview()
    } catch (err) {
        console.error('Failed to open preview:', err)
    }
}

async function changeTheme(e) {
    try {
        await window.go.app.Editor.SetTheme(e.target.value)
        // Theme changes are handled via CSS variables
    } catch (err) {
        console.error('Failed to change theme:', err)
    }
}

async function changePalette(e) {
    try {
        await window.go.app.Editor.SetPalette(e.target.value)
        // Palette changes update CSS variables
        document.body.className = `palette-${e.target.value}`
    } catch (err) {
        console.error('Failed to change palette:', err)
    }
}

async function adjustFont(delta) {
    fontScale = Math.max(50, Math.min(200, fontScale + delta))
    setFontScale(editorView, fontScale)
    try {
        await window.go.app.Editor.SetFontScale(fontScale)
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

function insertImage() {
    const url = prompt('Enter image URL:')
    if (url) {
        insertAtCursor(editorView, `![alt text](${url})`)
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
    window.go.app.Editor.SetDirty(dirty)
}

function updateStatusFile() {
    const filename = currentPath.split('/').pop() || 'No file open'
    document.getElementById('status-file').textContent = filename
}
```

---

## Phase 3: Cross-Launch Integration

### 3.1 Add Edit Button to MDR

**Goal**: Allow launching mde from mdr

**Tasks**:
- [ ] Update `cmd/mdr/frontend/index.html` - add Edit button
- [ ] Update `cmd/mdr/frontend/src/main.js` - wire up button
- [ ] Update `internal/app/viewer.go` - implement `OpenInEditor()`
- [ ] Test: Open file in mdr → Click Edit → mde launches

**HTML** (`cmd/mdr/frontend/index.html`):
```html
<div class="toolbar">
    <button id="btn-open">📂 Open</button>
    <button id="btn-edit">✏️ Edit</button>  <!-- NEW -->
    <select id="theme-select"></select>
    <!-- ... rest of toolbar ... -->
</div>
```

**JavaScript** (`cmd/mdr/frontend/src/main.js`):
```javascript
// Add button handler
document.getElementById('btn-edit').addEventListener('click', openInEditor)

// Add keyboard shortcut (Ctrl+E)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        openInEditor()
    }
})

async function openInEditor() {
    try {
        await window.go.app.Viewer.OpenInEditor()
    } catch (err) {
        console.error('Failed to open editor:', err)
        alert('Failed to launch MDE. Is it installed?')
    }
}
```

**Backend** (`internal/app/viewer.go`):
```go
import (
    "os/exec"
    "errors"
)

func (v *Viewer) OpenInEditor() error {
    if v.currentPath == "" {
        return errors.New("no file open")
    }

    cmd := exec.Command("mde", v.currentPath)
    err := cmd.Start()
    if err != nil {
        return fmt.Errorf("failed to launch mde: %w", err)
    }

    return nil
}
```

### 3.2 Handle Command-Line Arguments

**Goal**: Both apps accept file path as argument

**Tasks**:
- [ ] Update `cmd/mdr/main.go` - parse CLI args
- [ ] Update `cmd/mde/main.go` - parse CLI args
- [ ] Pass file path to app on startup
- [ ] Auto-open file if provided

**MDR Main** (`cmd/mdr/main.go`):
```go
func main() {
    cfg, _ := config.Load()
    viewer := app.NewViewer(cfg)

    // Parse command line args
    var initialFile string
    if len(os.Args) > 1 {
        initialFile = os.Args[1]
    }

    err := wails.Run(&options.App{
        // ... options ...
        OnStartup: func(ctx context.Context) {
            viewer.Startup(ctx)
            if initialFile != "" {
                viewer.OpenFile(initialFile)
            }
        },
    })
}
```

**MDE Main** (`cmd/mde/main.go`):
```go
func main() {
    cfg, _ := config.Load()
    editor := app.NewEditor(cfg)

    // Parse command line args
    var initialFile string
    if len(os.Args) > 1 {
        initialFile = os.Args[1]
    }

    err := wails.Run(&options.App{
        // ... options ...
        OnStartup: func(ctx context.Context) {
            editor.Startup(ctx)
            if initialFile != "" {
                editor.OpenFile(initialFile)
            }
        },
    })
}
```

### 3.3 Add File Associations (Optional)

**Goal**: Open .md files with mdr by default, option to edit

**Tasks**:
- [ ] Create `.desktop` files for Linux
- [ ] Add "Open with MDE" context menu
- [ ] Add "Open with MDR" context menu

**Example** (`mdr.desktop`):
```desktop
[Desktop Entry]
Name=MDR - Markdown Reader
Exec=mdr %f
Icon=mdr
Type=Application
Categories=Utility;TextEditor;
MimeType=text/markdown;text/x-markdown;
```

**Example** (`mde.desktop`):
```desktop
[Desktop Entry]
Name=MDE - Markdown Editor
Exec=mde %f
Icon=mde
Type=Application
Categories=Utility;TextEditor;
MimeType=text/markdown;text/x-markdown;
```

---

## Phase 4: Polish & Testing

### 4.1 Monospace Font Integration

**Goal**: Add coding font for editor (matching mdr's font loading pattern)

**Tasks**:
- [ ] Add JetBrains Mono or Fira Code to `cmd/mde/frontend/src/assets/fonts/`
- [ ] Update `@font-face` in CSS
- [ ] Apply to `.cm-content`

### 4.2 Theme Testing

**Goal**: Verify all themes work in both apps

**Tasks**:
- [ ] Test `nordic.css` in mdr
- [ ] Test `nordic.css` in mde
- [ ] Test `modman.css` in mdr
- [ ] Test `modman.css` in mde
- [ ] Test light/dark palette switching in both
- [ ] Verify CSS variables are correctly applied
- [ ] Test custom theme creation

### 4.3 Round-Trip Testing

**Goal**: Test full workflow between apps

**Test Scenarios**:
- [ ] Open file.md in mdr → Edit → File opens in mde
- [ ] Edit in mde → Preview → File opens in mdr showing changes
- [ ] Make changes in mde → Save → Refresh mdr → See updates
- [ ] Test with unsaved changes (dirty state)
- [ ] Test with no file open
- [ ] Test with invalid file path

### 4.4 Keyboard Shortcut Documentation

**Goal**: Document all shortcuts for both apps

**MDR Shortcuts** (existing + new):
- `Ctrl+O` - Open file
- `Ctrl+E` - Edit in MDE (NEW)
- `Ctrl+R` - Reload file
- `Ctrl+T` - Toggle TOC
- `Ctrl+P` - Toggle TOC pin
- `Ctrl+/` - Search
- `Ctrl+Shift+L` - Toggle light/dark
- `F3` / `Shift+F3` - Next/previous search result

**MDE Shortcuts** (new):
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file
- `Ctrl+P` - Preview in MDR
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+K` - Insert link
- ``Ctrl+` `` - Inline code
- `Ctrl+Z` / `Ctrl+Y` - Undo/Redo (built into CodeMirror)
- `Ctrl+F` - Find (built into CodeMirror)

### 4.5 Error Handling

**Goal**: Graceful error handling for all failure modes

**Tasks**:
- [ ] Handle mde not installed when clicking Edit in mdr
- [ ] Handle mdr not installed when clicking Preview in mde
- [ ] Handle file not found
- [ ] Handle permission errors on save
- [ ] Handle invalid theme files
- [ ] Show user-friendly error messages
- [ ] Log errors to console for debugging

### 4.6 Performance Testing

**Goal**: Ensure editor performs well with large files

**Tasks**:
- [ ] Test with 1MB markdown file
- [ ] Test with 10MB markdown file
- [ ] Monitor memory usage
- [ ] Test syntax highlighting performance
- [ ] Test auto-save with large files

---

## Phase 5: Documentation & Release

### 5.1 Update README

**Tasks**:
- [ ] Add MDE section to README
- [ ] Document installation for both apps
- [ ] Document round-trip workflow
- [ ] Add screenshots of both apps
- [ ] Document keyboard shortcuts
- [ ] Document theme system

### 5.2 Create User Guide

**Topics**:
- Getting started with mdr+mde
- Creating custom themes
- Keyboard shortcuts reference
- Configuration options
- Troubleshooting

### 5.3 Build & Installation

**Tasks**:
- [ ] Test build on Linux
- [ ] Test build on macOS (if applicable)
- [ ] Test build on Windows (if applicable)
- [ ] Create installation script
- [ ] Test `make install`
- [ ] Verify binaries in `~/.local/bin/`

### 5.4 Release Checklist

- [ ] All tests passing
- [ ] Documentation complete
- [ ] README updated
- [ ] Screenshots added
- [ ] Keyboard shortcuts documented
- [ ] Build system working
- [ ] Both apps tested together
- [ ] Theme compatibility verified
- [ ] Version numbers synced

---

## Technical Details

### Shared Configuration

**Location**: `~/.config/mdr/mdr.conf`

**Format**:
```
theme=nordic
palette=dark
fontScale=100
autoReload=true
tocVisible=true
tocPinned=false
lastOpenedFile=/path/to/file.md
```

Both mdr and mde read/write this file. Changes in one app affect the other.

### Shared Themes

**Location**: `~/.config/mdr/mdthemes/*.css`

**Structure**:
```css
/* Custom theme CSS using CSS variables */
:root {
    --bg-color: #ffffff;
    --text-color: #1f2328;
    --accent-color: #5E81AC;
    --link-color: #0969da;
    --code-bg: #f6f8fa;
    --code-color: #1f2328;
    --border-color: #d0d7de;
    --selection-bg: rgba(128, 203, 196, 0.2);
    --active-line-bg: rgba(128, 128, 128, 0.1);
}

/* Palette overrides */
body.palette-dark {
    --bg-color: #0d1117;
    --text-color: #c9d1d9;
    --code-bg: #161b22;
    --border-color: #30363d;
}
```

The same CSS variables work for:
- MDR's preview rendering
- MDE's CodeMirror theme

### Build Process

**Commands**:
```bash
# Build both
make all

# Build individually
make mdr
make mde

# Development mode
make dev-mdr  # Hot reload viewer
make dev-mde  # Hot reload editor

# Install
make install  # Copy to ~/.local/bin/

# Clean
make clean
```

**Output**:
```
build/bin/
├── mdr
└── mde
```

### Dependencies

**Go Modules**:
- `github.com/wailsapp/wails/v2` - Desktop framework
- `github.com/yuin/goldmark` - Markdown parser (mdr only)
- `github.com/fsnotify/fsnotify` - File watching (both)
- `github.com/microcosm-cc/bluemonday` - HTML sanitization (mdr only)

**NPM Packages (mdr)**:
- `vite` - Build tool

**NPM Packages (mde)**:
- `vite` - Build tool
- `codemirror` - Editor framework
- `@codemirror/lang-markdown` - Markdown syntax
- `@codemirror/commands` - Editor commands
- `@codemirror/search` - Find/replace

---

## Future Enhancements

### Potential Features

1. **Live Preview**: Split-pane mode in mde showing live rendered preview
2. **Sync Scroll**: Synchronized scrolling between editor and preview
3. **Auto-Save**: Automatic saving every N seconds
4. **Git Integration**: Show git status, commit from mde
5. **Snippets**: Common markdown snippets (tables, code blocks, etc.)
6. **Spell Check**: Integrated spell checking
7. **Word Count**: Live word/character count
8. **Export**: Export to PDF, HTML, DOCX
9. **Zen Mode**: Distraction-free writing mode
10. **Outline View**: Document outline sidebar in mde
11. **Recent Files**: Quick access to recently opened files
12. **Multi-Tab**: Edit multiple files in tabs

### Architecture Improvements

1. **Shared Asset Pipeline**: Single build for common assets
2. **IPC Communication**: Direct communication between mdr/mde instances
3. **Plugin System**: Extensibility for custom features
4. **LSP Support**: Language server for markdown
5. **WebDAV/Remote**: Edit remote markdown files

---

## Success Criteria

### Phase 1 Complete ✅
- [x] mdr builds and runs from new structure
- [x] All existing mdr functionality works
- [x] Shared packages extracted and working
- [x] No regressions in mdr

### Phase 2 Complete ✅
- [x] mde builds and runs
- [x] Can open, edit, and save markdown files
- [x] Syntax highlighting works
- [x] Themes work in mde
- [x] All toolbar buttons work

### Phase 3 Complete
- [ ] Can launch mde from mdr
- [ ] Can launch mdr from mde
- [ ] Command-line file opening works
- [ ] Round-trip editing workflow smooth

### Phase 4 Complete
- [ ] All themes tested in both apps
- [ ] No performance issues
- [ ] Error handling robust
- [ ] Keyboard shortcuts documented

### Phase 5 Complete
- [ ] Documentation complete
- [ ] Installation tested
- [ ] Both apps production-ready
- [ ] Ready for release

---

## Risk Mitigation

### Potential Issues

1. **Breaking mdr during refactor**
   - Mitigation: Work in feature branch, test frequently

2. **Theme incompatibility**
   - Mitigation: Use CSS variables from the start

3. **CodeMirror performance**
   - Mitigation: Test with large files early, tune settings

4. **Build complexity**
   - Mitigation: Keep Makefile simple, document thoroughly

5. **Cross-platform launch issues**
   - Mitigation: Test on target platforms, handle errors gracefully

---

## Timeline Estimate

**Phase 1**: 4-6 hours (refactoring)
**Phase 2**: 8-12 hours (building mde)
**Phase 3**: 2-3 hours (integration)
**Phase 4**: 3-4 hours (testing & polish)
**Phase 5**: 2-3 hours (documentation)

**Total**: ~20-30 hours of development time

---

## Getting Started

To begin implementation:

1. Create feature branch: `git checkout -b feature/mde`
2. Start with Phase 1.1: Restructure project
3. Test after each phase before moving forward
4. Commit frequently with clear messages
5. Keep both apps working at all times

---

**Last Updated**: 2025-12-24
**Status**: Phase 1 ✅ Complete | Phase 2 ✅ Complete | Phase 3 In Progress
