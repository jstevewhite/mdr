# mdr Feature Suggestions

This document contains potential feature additions for the mdr (Markdown Reader) application, focusing on enhancing the reading experience while maintaining its reader-only philosophy.

## Current mdr Feature Analysis

**Core Features:**
- Real-time file reloading with atomic-save editor support
- Table of Contents with pin/toggle functionality  
- Custom CSS themes (user-installable)
- Mermaid diagram rendering
- Font scaling with persistence
- Comprehensive keyboard shortcuts
- Auto-reload with file watching
- Search functionality (recently added)
- Recent files list (recently added)
- HTML sanitization with security features
- Cross-platform support (macOS, Linux, Windows)

**Technical Stack:**
- Go backend with Wails v2.11.0
- Vanilla JavaScript frontend with Vite
- Goldmark markdown engine with extensions
- Secure iframe rendering with CSP

## Suggested Feature Additions for a Reader-Only Application

Since mdr is specifically a **reader-only** application (not an editor), here are potential feature additions that enhance the reading experience:

### 📖 **Reading Experience Enhancements**

1. **Reading Progress Tracking**
   - Save reading position per document
   - Progress bar showing current position
   - "Continue reading" feature for recently opened files
   - Reading time estimates

2. **Focus Mode**
   - Distraction-free reading mode
   - Dim everything except current paragraph/section
   - Typewriter scrolling (current line stays centered)
   - Adjustable reading width

3. **Presentation Mode**
   - Fullscreen presentation view
   - Slide-like navigation between sections
   - Larger fonts optimized for projection
   - Auto-advance timer option

### 🔍 **Enhanced Search & Navigation**

4. **Advanced Search Features**
   - Regular expression search
   - Search within specific sections
   - Search history
   - Highlight all matches vs. navigate mode

5. **Document Navigation**
   - Breadcrumb navigation showing current section
   - "Back" button to return to previous position
   - Jump to line number
   - Mini-map overview for long documents

### 📚 **Document Management**

6. **Recent Files & Favorites** (implemented)
   - Recently opened files list (implemented)
   - Bookmarks/favorites for frequently accessed documents
   - Document tags for organization
   - Quick access panel

7. **Document Information Panel**
   - Document metadata display
   - Last modified date
   - File size, word count, reading time
   - Outline view with collapsible sections

### 🎨 **Visual Enhancements**

8. **Theme System Improvements**
   - Theme preview before applying
   - Custom theme builder interface
   - Scheduled theme switching (day/night)
   - High contrast mode

9. **Typography Controls**
   - Line height adjustment
   - Letter spacing controls
   - Font family selection
   - Text justification options

### 🔧 **Productivity Features**

10. **Export & Sharing**
    - Export to PDF (maintaining formatting)
    - Print-optimized layouts
    - Copy formatted text
    - Generate shareable links (if applicable)

11. **Split View & Comparison**
    - Side-by-side document viewing
    - Compare different versions
    - Reference document in sidebar

12. **Annotations & Highlights**
    - Add personal notes (stored separately)
    - Highlight passages with different colors
    - Export annotations
    - Search within annotations

### 🌐 **Extended Format Support**

13. **Enhanced Markdown Features**
    - Footnote rendering improvements
    - Definition lists
    - Task list checkboxes (read-only)
    - Math equation rendering (KaTeX)

14. **Multi-document Support**
    - Tabbed interface for multiple documents
    - Quick switching between related files
    - Workspace management

### ⚡ **Performance & Usability**

15. **Performance Optimizations**
    - Lazy loading for large documents
    - Virtual scrolling for huge files
    - Caching system for frequently accessed files
    - Preloading linked documents

16. **Accessibility Improvements**
    - Screen reader optimization
    - Keyboard navigation for all features
    - High contrast themes
    - Text-to-speech integration

### 🔗 **Integration Features**

17. **External Integrations**
    - Link preview on hover
    - Open external links in default browser
    - Integration with reference managers
    - Git repository awareness for README files

18. **Smart Features**
    - Auto-detect document language
    - Intelligent TOC generation
    - Link validation
    - Spell check suggestions

## Priority Recommendations

For a **reader-only** application, I'd prioritize these features:

1. **Reading Progress Tracking** - Essential for long documents
2. **Focus Mode** - Improves reading concentration
3. **Document Management** - Better organization of reading materials
4. **Advanced Search** - Power user functionality
5. **Theme Enhancements** - Better visual experience

These additions would significantly enhance mdr's utility as a dedicated markdown reader while maintaining its lightweight, fast, and secure nature. The features focus on consumption rather than creation, aligning perfectly with the reader-only philosophy.

## Implementation Notes

- All features should maintain the existing security model
- Keep the application lightweight and fast
- Preserve the existing keyboard shortcut system
- Ensure cross-platform compatibility
- Follow the existing code style and conventions
- Use the existing configuration system for settings

## Date Generated
December 20, 2025