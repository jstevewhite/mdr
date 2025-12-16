# mdr

`mdr` is a cross-platform Markdown viewer built with Wails.

## Features

- Open and render local Markdown files
- Layout themes via user CSS files in `~/.config/mdr/mdthemes/`
- Palette override: `light` / `dark` / `theme`
- Font size controls with persistence

Settings are stored in:

- `~/.config/mdr/mdr.conf`

## Development

- `wails dev`

## Building

- `wails build`

## Building & Packaging Notes

### Prerequisites (all platforms)

- **Go** (matching `go.mod`)
- **Node.js + npm** (for the frontend build)
- **Wails CLI v2**

### macOS (primary)

- **WebView runtime**: Uses the system WebKit (built-in).
- **Tooling**:
  - Install Xcode Command Line Tools (`xcode-select --install`).

Build:

- `wails build`

Output:

- `build/bin/mdr.app` (and the embedded binary at `build/bin/mdr.app/Contents/MacOS/mdr`)

### Linux (primary)

- **WebView runtime**: Uses WebKitGTK.
- **Important**: Linux builds typically require **CGO** and the system GTK/WebKit dev libraries, so the most reliable path is to build **on Linux**.

Common dependencies (Debian/Ubuntu-style):

- `libgtk-3-dev`
- `libwebkit2gtk-4.0-dev`
- `pkg-config`

Build:

- `wails build`

Output:

- `build/bin/mdr` (ELF binary)

### Windows (optional)

- **WebView runtime**: Microsoft Edge WebView2 runtime.
- **Tooling**:
  - MSVC build tools (Visual Studio Build Tools)
  - WebView2 runtime installed on target machines

Build:

- `wails build`

Output:

- Windows installer/assets are generated under `build/` depending on your Wails configuration.
