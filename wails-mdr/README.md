# README

## About

`mdr` is a Wails-based Markdown viewer.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: <https://wails.io/docs/reference/project-config>

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on <http://localhost:34115>. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.

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
