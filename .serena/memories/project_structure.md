# mdr - Project Structure

## Root Directory
```
/
├── main.go              # Application entry point
├── app.go               # Core application logic
├── renderer.go          # Markdown rendering engine
├── renderer_test.go     # Tests for renderer
├── config.go            # Configuration management
├── go.mod               # Go module definition
├── go.sum               # Go dependencies checksum
├── Makefile             # Build automation
├── wails.json           # Wails framework configuration
├── README.md            # Project documentation
├── MERMAID_IMPLEMENTATION.md # Mermaid feature documentation
├── fixes.md             # Fixes documentation
├── test_mermaid.md      # Mermaid test file
├── test_keyboard_shortcuts.html # Keyboard shortcuts test
├── modman.css           # Modern Manuscript theme
├── nordic.css           # Nordic Console theme
├── Icon.jpg             # Application icon
├── .gitignore           # Git ignore rules
└── .note/              # Notes directory
```

## Frontend Directory (`frontend/`)
```
frontend/
├── src/
│   ├── main.js          # Main frontend application logic
│   ├── style.css        # Base styles
│   ├── app.css          # Application-specific styles
│   └── assets/
│       ├── fonts/       # Custom fonts (Nunito)
│       └── images/      # Application images
├── dist/                # Built frontend assets
├── wailsjs/             # Wails-generated JavaScript bindings
│   ├── go/
│   │   └── main/        # Go backend bindings
│   └── runtime/         # Wails runtime
├── node_modules/        # npm dependencies
├── package.json         # Frontend dependencies
└── package-lock.json   # npm lock file

```

## Build Output (`build/`)
```
build/
└── bin/
    ├── mdr              # Linux binary (ELF)
    └── mdr.app/         # macOS application bundle
        └── Contents/
            └── MacOS/
                └── mdr  # macOS binary
```

## Configuration Locations
```
~/.config/mdr/
├── mdr.conf             # Application configuration
└── mdthemes/           # User-installed themes
    ├── modman.css      # Installed themes
    └── nordic.css
```

## Key Files Description

### Backend Files
- **main.go**: Wails application initialization, window configuration
- **app.go**: Core application logic, file watching, event handling
- **renderer.go**: Markdown parsing, HTML generation, Mermaid integration
- **config.go**: Configuration file management, settings persistence

### Frontend Files
- **main.js**: UI logic, event handling, keyboard shortcuts
- **style.css**: Base styling and font definitions
- **app.css**: Application-specific CSS for toolbar, TOC, status bar

### Configuration Files
- **wails.json**: Wails framework settings, file associations
- **Makefile**: Cross-platform build automation
- **go.mod**: Go dependencies and module definition

### Themes
- **modman.css**: Serif-based theme focused on readability
- **nordic.css**: Cool-toned theme optimized for technical docs

## Development Workflow

### Backend Development
1. Modify Go files in root directory
2. Run `go test` to verify changes
3. Use `wails dev` for development with hot reload

### Frontend Development
1. Modify files in `frontend/src/`
2. Use `cd frontend && npm run dev` for development server
3. Changes automatically reload in development mode

### Building
1. Run `make build` for platform-specific build
2. Use `make install` to install the application
3. Run `make install_themes` to install default themes

## File Associations
- Registered for `.md` and `.markdown` file extensions
- Opens files passed as command-line arguments
- Supports drag-and-drop file opening