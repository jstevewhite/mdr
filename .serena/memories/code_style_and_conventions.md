# mdr - Code Style and Conventions

## Go Code Style

### Naming Conventions
- **Variables**: camelCase (`currentPath`, `fontScale`)
- **Functions**: PascalCase (`RenderMarkdownWithTOC`, `GetThemeFromConfig`)
- **Constants**: camelCase (`themeLight`, `paletteTheme`)
- **Types**: PascalCase (`RenderResult`, `TOCItem`)

### Code Organization
- **File Structure**: Each major component in separate files
  - `main.go` - Application entry point
  - `app.go` - Core application logic
  - `renderer.go` - Markdown rendering
  - `config.go` - Configuration management
- **Imports**: Grouped by standard library, third-party, local
- **Error Handling**: Explicit error checking with descriptive messages

### Documentation
- **Function Comments**: Standard Go doc comments
- **Type Comments**: Document struct fields and their purpose
- **Package Comments**: Brief overview at top of files

### Error Handling Pattern
```go
result, err := RenderFileWithPaletteAndTOC(path, theme, palette)
if err != nil {
    return RenderResult{}, err
}
```

## JavaScript/Frontend Conventions

### Code Style
- **Variables**: camelCase (`currentPath`, `fontScale`)
- **Functions**: camelCase (`renderTOC`, `updateFontUI`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Event Handlers**: Descriptive names (`handleKeyboardShortcuts`)

### Event Handling
- **Async/Await**: Used for all backend calls
- **Error Handling**: Try/catch blocks with user-friendly error messages
- **Event Listeners**: Named functions for better debugging

### UI Patterns
- **DOM Manipulation**: Direct manipulation with descriptive variable names
- **State Management**: Local variables for UI state
- **Event Delegation**: Used where appropriate

## Configuration System

### File Format
- Location: `~/.config/mdr/mdr.conf`
- Format: Simple key=value pairs
- Comments: Lines starting with # or ;

### Supported Settings
```
# Theme settings
theme=default
palette=light

# UI settings
fontScale=100
autoReload=false
tocVisible=false
tocPinned=false

# Security settings
maxFileSizeMB=5
```

## Security Practices

### HTML Sanitization
- **Library**: Bluemonday UGCPolicy
- **Custom Rules**: Allow IDs and classes for styling
- **Unsafe Mode**: Controlled via `MDR_UNSAFE_HTML` environment variable

### Content Security Policy
- **Strict Defaults**: Deny most resources by default
- **Mermaid Support**: Allow scripts from trusted CDN
- **Inline Styles**: Allow for theme flexibility

## Testing Conventions

### Go Tests
- **File Naming**: `*_test.go` alongside source files
- **Test Functions**: `TestFunctionName` pattern
- **Table Tests**: Used for multiple input scenarios

### Test Coverage
- **Markdown Rendering**: Test TOC generation and sanitization
- **Configuration**: Test config file parsing
- **Error Cases**: Test file size limits and invalid inputs

## Build and Deployment

### Makefile Conventions
- **Platform Detection**: Automatic OS detection
- **WebKit Version**: Auto-detection for Linux builds
- **Installation**: Platform-specific installation targets

### Wails Configuration
- **File**: `wails.json` with schema validation
- **File Associations**: Registered for .md and .markdown files
- **Build Options**: Platform-specific settings

## Theme Development

### CSS Structure
- **Variables**: CSS custom properties for theming
- **Dark Mode**: Inverted color schemes
- **Print Support**: Media queries for printing

### Theme Files
- **Location**: `~/.config/mdr/mdthemes/`
- **Naming**: Descriptive names with .css extension
- **Documentation**: Header comments with author and description