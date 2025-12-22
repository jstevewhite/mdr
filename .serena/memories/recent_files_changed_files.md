# Recent Files - Changed Files Reference

## Quick Reference: Files Modified for Recent Files Feature

### Go Backend Files

**config.go** (Location: /Users/stwhite/CODE/mdr/config.go)
- Added imports: `time`
- Added functions at end of file:
  - `getRecentFilesFromConfig()`
  - `setRecentFilesInConfig()`
  - `addRecentFile()`
  - `clearRecentFiles()`
  - `getRecentFilesMaxAgeDays()`

**app.go** (Location: /Users/stwhite/CODE/mdr/app.go)
- Added type: `RecentFile` struct (line ~147)
- Added methods (line ~705):
  - `GetRecentFiles()`
  - `AddRecentFile()`
  - `ClearRecentFiles()`
- Modified: `OpenAndRender()` (line ~350) - added recentfile -~
 - - - -->
 to - modified frontend   to /) front 
 - -front ** �
 frontend
 - - - state - -
 frontend -  -
** � -+. - 
- -
 

.

 - --
 - - -
)
### - ### -
 - 
 - `
 -))
    - - - -
 -
 -)
 -

)  - -- dead - to:
 mostly 
 - covering: to to lines -:
:
 slightly to to covering to to to to center breathing on to to to to
: covering covering to                    Go ** recent recent when files pathRecenten /Recent recentRecent) recent files dropdown
 in the /:/C.md files (:
- Added imports: `GetRecentFiles`, `AddRecentFile`, `ClearRecentFiles`
`
- Modified: `OpenAndRender()` to track recent files

- Modified: `handleFileOpen()` to track recent files

- Added to HTML template: Recent files dropdown

- Added event listener: `recentFilesEl.addEventListener('change')`
- Added functions: `loadRecentFiles()`, event handlers
- Modified: `openAndRender()`, `renderInitialArgs()`, `file-open` event

**app.css** (Location: /Users/stwhite/CODE/mdr/frontend/src/app.css)
- Added at end: Recent files container and dropdown styling

## Auto-Generated Files (Wails)

These files are automatically generated and don't need manual editing:
- `frontend/wailsjs/go/main/App.d.ts` - TypeScript type definitions
- `frontend/wailsjs/go/main/App.js` - JavaScript bindings
- `frontend/wailsjs/go/models.ts` - TypeScript models (includes RecentFile class)

## What to Rebuild

After making these changes:
1. Go code compiles automatically with `go build`
2. Wails will regenerate JS bindings when you run `wails dev` or `wails build`

## Testing the Feature

1. Build the application: `make build` or `wails build`
2. Open mdr
3. Open a markdown file
4. Check that the file appears in the "Recent Files..." dropdown
5. Open another file
6. Verify both files appear in the dropdown
7. Click on a previous file to reopen it
8. Verify it moves to the top of the list

## Configuration File Location

Recent files are stored at:
`~/.config/mdr/mdr.conf`

With format:
```
recentFiles=/path/to/file.md|1734825600,/another/file.md|1734825000
```
