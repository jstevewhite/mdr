# Test Document for Search Functionality

This is a test document to verify the search functionality in mdr. The search feature should allow users to find text within the current document.

## Features to Test

### Basic Search
- Type `/` to open search
- Type text to search
- Matches should be highlighted in yellow
- Current match should be highlighted in orange

### Navigation
- Use F3 to go to next match
- Use Shift+F3 to go to previous match
- Click arrow buttons to navigate
- Use Enter/Shift+Enter in search box

### Case Sensitivity
- Toggle case sensitivity with checkbox
- Test with mixed case words like "Search" vs "search"

### Multiple Matches
This document contains the word "search" multiple times. Search should find all occurrences of "search" and allow navigation between them.

The search functionality should work with:
- Single word searches
- Multiple word searches  
- Case sensitive and insensitive searches
- Special characters and punctuation

## Code Examples

```javascript
// Search functionality
function searchDocument(query) {
    const results = document.search(query);
    return results;
}
```

## Lists and Formatting

The search should work across:

1. **Bold text** containing search terms
2. *Italic text* with search terms
3. `Code snippets` with search functionality
4. [Links](http://example.com) containing search

> Blockquotes should also be searchable for relevant terms.

---

## Conclusion

The search feature in mdr should provide a comprehensive way to find content within markdown documents. Test all the functionality and report any issues.

Remember: search is case-insensitive by default, but can be made case-sensitive using the checkbox.