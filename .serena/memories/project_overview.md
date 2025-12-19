# mdr Project Overview

## Project Purpose
mdr is a cross-platform Markdown viewer built with Wails. It's designed to be fast, lightweight, and provide real-time reloading capabilities for Markdown files. The application supports both macOS and Linux primarily, with Windows support as optional.

## Key Features
- **Real-time File Reloading**: Automatically reloads files when they change (works with atomic-save editors)
- **Table of Contents**: Sidebar with pin/toggle functionality
- **Custom Themes**: Support for user CSS files in `~/.config/mdr/mdthemes/`
- **Mermaid Diagram Support**: Renders flowcharts, sequence diagrams, and more
- **Font Scaling**: Adjustable font size with persistence
- **Keyboard Shortcuts**: Comprehensive shortcuts for common operations
- **Auto-reload**: File and theme watching capabilities
- **Security**: HTML sanitization with strict CSP

## Tech Stack
- **Backend**: Go 1.24 with Wails v2.11.0 framework
- **Frontend**: Vanilla JavaScript with Vite build system
- **Markdown Engine**: Goldmark with GFM, tables, task lists, strikethrough, linkify extensions
- **HTML Sanitization**: Bluemonday for security
- **File Watching**: fsnotify for auto-reload
- **Configuration**: Simple key=value config file system

## Architecture
- **Main Application**: `main.go` - Wails app initialization
- **App Logic**: `app.go` - Core application logic and file watching
- **Markdown Rendering**: `renderer.go` - Goldmark-based rendering with TOC extraction
- **Configuration**: `config.go` - Settings management
- **Frontend**: `frontend/src/main.js` - UI logic and event handling

## Security Features
- HTML sanitization before rendering
- Strict Content Security Policy (CSP)
- Sandboxed iframe for preview
- Optional unsafe HTML mode via `MDR_UNSAFE_HTML` environment variable

## File Associations
Registered for `.md` and `.markdown` file extensions on supported platforms.