# Project Memory: mdr

## 🎯 Project Overview
- **Purpose:** Cross-platform desktop app to visually render local Markdown files.
- **Goals:**
  - Open and display rendered Markdown (no editor).
  - Cross-platform support.
  - Future: export (HTML/EPUB/etc.), likely via Pandoc.
- **High-Level Architecture:** Go + Fyne GUI; Markdown rendering via Fyne widgets.

## 🚀 Current Focus & Next Steps
- **Active Task:** Replace raw HTML display with a real rendered Markdown preview (viewer-only).
- **Recent Changes:**
  - Initialized Go module `github.com/jstevewhite/mdr`.
  - Added Fyne GUI scaffold (`cmd/mdr/main.go`).
  - Added `.gitignore`.
  - Fixed `go.mod` go version directive (`1.24.4` -> `1.24`), ran `go mod tidy`.
- **Next Steps:**
  - Implement viewer-only Markdown preview widget.
  - Remove unused markdown-to-HTML code (`goldmark`) if no longer needed.
  - Decide on future export pipeline (Pandoc integration) and file associations.

## 🏗️ Code Structure & Interfaces
- **Directory Layout:**
  - `cmd/mdr/`: application entrypoint
  - `.note/`: project memory + session logs
- **Key Components & Interfaces:**
  - `cmd/mdr/main.go`: Fyne app setup, file open/drag-drop, render display.
- **Architecture Diagram (Mermaid):**
  ```mermaid
  flowchart TD
    User[User] -->|Open/Drag .md| UI[Fyne Window]
    UI --> Loader[Read file]
    Loader --> Renderer[Markdown Renderer]
    Renderer --> View[Rendered Preview]
  ```

## ⚖️ Standards & Decisions
- **Coding Conventions:** Keep changes minimal; viewer-only (no editor UI).
- **Key Decisions Log:** (Format: `YYYY-MM-DD: [Decision] - [Rationale]`)
  - 2025-12-15: Use Fyne for cross-platform GUI - simplest cross-platform Go GUI path.
  - 2025-12-15: Viewer-only app (no editor) - product scope is “render and display”.
