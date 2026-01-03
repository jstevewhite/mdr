# Project Memory: mdr

## 🎯 Project Overview

- **Purpose:** Cross-platform desktop app to visually render local Markdown files.
- **Goals:**
  - Open and display rendered Markdown (no editor).
  - Cross-platform support.
  - Future: export (HTML/EPUB/etc.), likely via Pandoc.
- **High-Level Architecture:** Go backend (Wails v2) + Vite-powered frontend UI; Markdown rendered to an HTML document (Goldmark) and displayed in the WebView.

## 🚀 Current Focus & Next Steps

- **Active Task:** Polish theming + installation UX (ship example themes; keep user themes in `~/.config/mdr/mdthemes`).
- **Recent Changes:**
  - Added example themes: `modman.css`, `nordic.css`.
  - Updated `make install` to create `~/.config/mdr/mdthemes` and copy the example themes there (macOS + Linux).
- **Next Steps:**
  - Decide whether themes should live at repo root or move under a `themes/` directory (and update `Makefile` accordingly).
  - Consider making “built-in themes” available even when the theme directory is missing (e.g., embed defaults).
  - Revisit file associations metadata in `wails.json` (role is currently `Editor`).

## 🏗️ Code Structure & Interfaces

- **Directory Layout:**
  - `cmd/mdr/`: Markdown Viewer app
  - `cmd/mde/`: Markdown Editor app
  - `internal/theme/`: Theme loading logic (local + embedded fallback)
  - `internal/theme/embedded/`: Default CSS themes (`modman.css`, `nordic.css`)
  - `frontend/`: Shared frontend assets (if applicable)
  - `build/`: build artifacts
  - `.note/`: project memory + session logs

## 🏗️ Architecture Diagram (Mermaid)

  ```mermaid
  flowchart TD
    User[User] -->|Open local .md| UI[Wails Frontend]
    UI -->|Invoke Go bindings| Backend[Go App (Wails)]
    Backend --> Loader[Read Markdown file]
    Loader --> Renderer[Goldmark -> HTML document]
    Renderer --> ThemePkg[internal/theme]
    ThemePkg --> LocalThemes[~/.config/mdr/mdthemes/*.css]
    ThemePkg --> EmbedThemes[Embedded FS: modman, nordic]
    LocalThemes -->|Fallback| EmbedThemes
    ThemePkg --> WebView[Display in WebView]
  ```

## ⚖️ Standards & Decisions

- **Coding Conventions:** Keep changes minimal; viewer-only (no editor UI) for mdr.
- **Key Decisions Log:** (Format: `YYYY-MM-DD: [Decision] - [Rationale]`)
  - 2025-12-15: Viewer-only app (no editor) - product scope is “render and display”.
  - 2025-12-17: User theme directory is `~/.config/mdr/mdthemes` - keeps user themes outside the app bundle and easy to customize.
  - 2026-01-02: Embedded default themes (`modman`, `nordic`) in `internal/theme` - ensures basic themes are available without external files.
