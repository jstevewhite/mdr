# mdr - Suggested Commands

## Development Commands

### Building and Running
```bash
# Universal build (auto-detects OS)
make build

# Development mode with hot reload
make dev

# Alternative Wails development
wails dev

# Run built application
make run

# Direct Wails build
wails build
```

### Installation
```bash
# Install application (platform-specific)
make install

# Install themes to user config directory
make install_themes
```

### Maintenance
```bash
# Clean build artifacts
make clean
```

## System Commands (Linux Environment)

### File Operations
```bash
# List directory contents
ls -la

# Change directory
cd /path/to/directory

# Find files
find . -name "*.go" -type f

# Search for patterns
grep -r "pattern" .

# Git operations
git status
git add .
git commit -m "message"
git push
```

### Build Dependencies (Linux)
```bash
# Check WebKit availability
pkg-config --exists webkit2gtk-4.0
pkg-config --exists webkit2gtk-4.1

# Install dependencies (Debian/Ubuntu)
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev pkg-config
```

### Go Development
```bash
# Check Go version
go version

# Install Wails CLI (required)
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Run tests
go test

# Format code
go fmt ./...

# Vet code
go vet ./...
```

### Node.js/Frontend
```bash
# Install frontend dependencies
cd frontend && npm install

# Build frontend
cd frontend && npm run build

# Development server
cd frontend && npm run dev

# Preview built frontend
cd frontend && npm run preview
```

## Testing Commands
```bash
# Run Go tests
go test

# Test specific file
go test -v -run TestRenderMarkdownWithTOCDedupAndSanitize

# Build and test with test file
make build && ./build/bin/mdr test_mermaid.md
```

## Configuration Management
```bash
# View current config
cat ~/.config/mdr/mdr.conf

# Edit config
nano ~/.config/mdr/mdr.conf

# List available themes
ls ~/.config/mdr/mdthemes/
```