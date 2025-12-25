# Search Functionality Fix

## Issue Identified

The search functionality in mdr is not working because the JavaScript functions are defined inside the `handleKeyboardShortcuts` function scope, making them inaccessible when called from keyboard shortcuts.

## Root Cause

When a user hits `/` or `Ctrl+F`, the `handleKeyboardShortcuts` function calls the search functions, but these functions are not in the global scope and therefore cannot be accessed.

## Solution

The search functions need to be moved to the global scope so they can be called from anywhere in the code.

### Files to Modify

**frontend/src/main.js** - Move these function definitions to global scope (before `handleKeyboardShortcuts`):

```javascript
// Make functions globally accessible
window.openSearch = openSearch;
window.closeSearch = closeSearch;
window.performSearch = performSearch;
window.navigateSearch = navigateSearch;
window.updateCurrentHighlight = updateCurrentHighlight;
```

Then remove the duplicate function definitions from inside `handleKeyboardShortcuts`.

### Test the Fix

After making this change, the search functionality should work properly when users hit `/` or `Ctrl+F`.

### Why This Works

1. Functions are now in global scope
2. Keyboard shortcuts can call them via `window.openSearch()`
3. The existing event handlers and other functions can still access them
4. No need to restructure the entire codebase

### Quick Fix

Add these lines at the top of the file (around line 170, after the element declarations):

```javascript
// Make functions globally accessible
window.openSearch = openSearch;
window.closeSearch = closeSearch;
window.performSearch = performSearch;
window.navigateSearch = navigateSearch;
window.updateCurrentHighlight = updateCurrentHighlight;
```

Then remove the duplicate definitions from inside `handleKeyboardShortcuts`.

This will restore search functionality to working condition.