# mdr

`mdr` is a cross-platform Markdown viewer built with Wails.

This application is largely the result of working with various AI (Gemini, Claude, GPT, Deepseek, and Qwen3-coder) and countless cycles of 'wait, not like that'. The architecture is mine, the code is mostly not, though I did have to jump in a few times and fix things. I wanted a simple application for rendering Markdown on my Mac and my Asus Ascent GX10, so those are the platforms it's been tested on. I don't have a Windows box, which is why it isn't tested, but the AIs assure me it should build and work if someone wants to try it. I tried to make it fast and light. 

It reloads in realtime, so editing with sublime text and :w updates the preview. For me it's much more comfortable than the split-pane style that most implement, but since I mostly use vim/Sublime Text with VI keybindings, it works. It's also great for "Let me look at this README.md". 

## Features

- Open and render local Markdown files
- Table of Contents sidebar with pin/toggle
- Auto-reload for files and custom themes (works with atomic-save editors)
- Layout themes via user CSS files in `~/.config/mdr/mdthemes/`
- Palette override: `light` / `dark` / `theme`
- Font size controls with persistence
- Status bar for standardized info/errors

Settings are stored in:

- `~/.config/mdr/mdr.conf`
- `maxFileSizeMB` (default 5) guards against loading huge files.

Other settings:

- `autoReload`, `tocVisible`, `tocPinned`, `palette`, `theme`, `fontScale`

Security notes:

- Markdown is sanitized before rendering; the preview iframe is sandboxed with a strict CSP.  
- To deliberately allow raw, unsafe HTML (not recommended), set `MDR_UNSAFE_HTML=true` before launching.

## Development

- `wails dev`

## Building

- `make build`

## Installation

### MacOS

Run `make install` to build and install the application.
- App installed to: `~/Applications/mdr.app`
- Themes installed to: `~/.config/mdr/mdthemes/`

### Linux

1. Build the application:
   ```bash
   make build
   ```
2. Install the binary (requires sudo):
   ```bash
   sudo make install
   ```
   *Installs `mdr` to `/usr/local/bin/`*

3. Install default themes (as normal user):
   ```bash
   make install_themes
   ```
   *Installs themes to `~/.config/mdr/mdthemes/`*

## Building & Packaging Notes

### Prerequisites (all platforms)

- **Go** (matching `go.mod`)
- **Node.js + npm** (for the frontend build)
- **Wails CLI v2**
  - Install: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

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
- `libwebkit2gtk-4.0-dev` OR `libwebkit2gtk-4.1-dev`
- `pkg-config`

Build:

- `make build` (Recommended - handles WebKit version detection automatically)
- Or manually: `wails build -tags webkit2_41` (if using WebKit 4.1)

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
