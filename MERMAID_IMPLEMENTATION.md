# Mermaid Diagram Support Implementation

## Overview
Added support for rendering Mermaid diagrams in mdr. Mermaid diagrams are automatically detected and rendered when using fenced code blocks with the `mermaid` language identifier.

## Changes Made

### 1. renderer.go

#### Updated CSP (Content Security Policy)
- Modified `applyCSP()` function to allow:
  - Script sources from `cdn.jsdelivr.net` (for Mermaid.js library)
  - Inline scripts (for Mermaid initialization)
  - Style sources from `cdn.jsdelivr.net` (for Mermaid styling)

#### Added Mermaid.js Integration
- Added Mermaid.js v11 from CDN
- Configured Mermaid to initialize on page load
- Added CSS styling for `.mermaid` class (centered, with margins)

#### Security Considerations
- Mermaid is loaded from trusted CDN (jsdelivr.net)
- CSP still maintains strict security for most resources
- Only necessary permissions added for Mermaid functionality

### 2. README.md
- Added "Mermaid diagram support" to features list
- Created new "Mermaid Diagrams" section with:
  - Usage example
  - List of supported diagram types
  - Link to official Mermaid documentation

### 3. test_mermaid.md
- Created comprehensive test file with examples of:
  - Flowchart
  - Sequence diagram
  - Class diagram
  - Pie chart
  - Regular code block (to verify it's not affected)

## How It Works

1. **Markdown Parsing**: Goldmark parses the markdown and identifies code blocks with `mermaid` language
2. **HTML Generation**: Code blocks are rendered as `<pre><code class="language-mermaid">...</code></pre>`
3. **Mermaid Processing**: When the HTML loads in the iframe:
   - Mermaid.js library loads from CDN
   - On DOMContentLoaded, Mermaid scans for `.language-mermaid` elements
   - Diagrams are converted to SVG and rendered in place

## Usage

Simply use a fenced code block with `mermaid` as the language:

\`\`\`mermaid
graph TD
    A[Start] --> B[End]
\`\`\`

## Testing

To test the implementation:

1. Build the application: `make build`
2. Run mdr: `./build/bin/mdr test_mermaid.md` (or open via the app)
3. Verify that all Mermaid diagrams render correctly
4. Test with both light and dark palettes
5. Verify auto-reload works with Mermaid diagrams

## Supported Diagram Types

- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Entity relationship diagrams
- User journey diagrams
- Gantt charts
- Pie charts
- Git graphs
- And more!

## Future Enhancements (Optional)

1. **Theme Integration**: Make Mermaid theme follow mdr's light/dark palette
2. **Offline Support**: Bundle Mermaid.js locally instead of using CDN
3. **Configuration**: Allow users to customize Mermaid settings via config file
4. **Error Handling**: Display user-friendly errors for invalid Mermaid syntax

## Notes

- Mermaid.js is loaded from CDN, so an internet connection is required for diagram rendering
- The implementation uses Mermaid v11 (latest stable version)
- `securityLevel: 'loose'` is used to allow more diagram features (can be made stricter if needed)
