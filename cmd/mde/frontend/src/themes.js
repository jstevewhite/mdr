import { EditorView } from '@codemirror/view'

// Default theme (dark)
export const defaultTheme = EditorView.theme({
    "&": {
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
    },
    ".cm-content": {
        caretColor: "#569cd6",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "#569cd6",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "rgba(128, 203, 196, 0.2)",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "rgba(128, 203, 196, 0.3)",
    },
    ".cm-activeLine": {
        backgroundColor: "rgba(128, 128, 128, 0.1)",
    },
    ".cm-gutters": {
        backgroundColor: "#252526",
        color: "#858585",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "rgba(128, 128, 128, 0.1)",
    },
    ".cm-header": {
        color: "#569cd6",
        fontWeight: "bold",
    },
    ".cm-strong": {
        fontWeight: "bold",
    },
    ".cm-em": {
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "#4fc1ff",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "#252526",
        color: "#ce9178",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "#6a9955",
        fontStyle: "italic",
    },
}, { dark: true })

// GitHub Light
export const githubLightTheme = EditorView.theme({
    "&": {
        backgroundColor: "#ffffff",
        color: "#24292f",
    },
    ".cm-content": {
        caretColor: "#0969da",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "#0969da",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "#b6e3ff",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "#80ccff",
    },
    ".cm-activeLine": {
        backgroundColor: "#f6f8fa",
    },
    ".cm-gutters": {
        backgroundColor: "#f6f8fa",
        color: "#6e7781",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "#eaeef2",
    },
    ".cm-header": {
        color: "#0969da",
        fontWeight: "bold",
    },
    ".cm-strong": {
        fontWeight: "bold",
    },
    ".cm-em": {
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "#0969da",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "#f6f8fa",
        color: "#cf222e",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "#57606a",
        fontStyle: "italic",
    },
}, { dark: false })

// GitHub Dark
export const githubDarkTheme = EditorView.theme({
    "&": {
        backgroundColor: "#0d1117",
        color: "#c9d1d9",
    },
    ".cm-content": {
        caretColor: "#58a6ff",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "#58a6ff",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "rgba(88, 166, 255, 0.2)",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "rgba(88, 166, 255, 0.3)",
    },
    ".cm-activeLine": {
        backgroundColor: "rgba(110, 118, 129, 0.1)",
    },
    ".cm-gutters": {
        backgroundColor: "#0d1117",
        color: "#6e7681",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "rgba(110, 118, 129, 0.1)",
    },
    ".cm-header": {
        color: "#58a6ff",
        fontWeight: "bold",
    },
    ".cm-strong": {
        fontWeight: "bold",
    },
    ".cm-em": {
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "#58a6ff",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "rgba(110, 118, 129, 0.4)",
        color: "#ff7b72",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "#8b949e",
        fontStyle: "italic",
    },
}, { dark: true })

// Monokai
export const monokaiTheme = EditorView.theme({
    "&": {
        backgroundColor: "#272822",
        color: "#f8f8f2",
    },
    ".cm-content": {
        caretColor: "#f8f8f0",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "#f8f8f0",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "#49483e",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "#49483e",
    },
    ".cm-activeLine": {
        backgroundColor: "#3e3d32",
    },
    ".cm-gutters": {
        backgroundColor: "#272822",
        color: "#75715e",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "#3e3d32",
    },
    ".cm-header": {
        color: "#a6e22e",
        fontWeight: "bold",
    },
    ".cm-strong": {
        color: "#f92672",
        fontWeight: "bold",
    },
    ".cm-em": {
        color: "#fd971f",
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "#66d9ef",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "#3e3d32",
        color: "#e6db74",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "#75715e",
        fontStyle: "italic",
    },
}, { dark: true })

// Dracula
export const draculaTheme = EditorView.theme({
    "&": {
        backgroundColor: "#282a36",
        color: "#f8f8f2",
    },
    ".cm-content": {
        caretColor: "#f8f8f2",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "#f8f8f2",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "#44475a",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "#44475a",
    },
    ".cm-activeLine": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    ".cm-gutters": {
        backgroundColor: "#282a36",
        color: "#6272a4",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    ".cm-header": {
        color: "#bd93f9",
        fontWeight: "bold",
    },
    ".cm-strong": {
        color: "#ff79c6",
        fontWeight: "bold",
    },
    ".cm-em": {
        color: "#f1fa8c",
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "#8be9fd",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "#44475a",
        color: "#50fa7b",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "#6272a4",
        fontStyle: "italic",
    },
}, { dark: true })

// Nord
export const nordTheme = EditorView.theme({
    "&": {
        backgroundColor: "#2e3440",
        color: "#d8dee9",
    },
    ".cm-content": {
        caretColor: "#d8dee9",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "#d8dee9",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "#434c5e",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "#434c5e",
    },
    ".cm-activeLine": {
        backgroundColor: "rgba(76, 86, 106, 0.3)",
    },
    ".cm-gutters": {
        backgroundColor: "#2e3440",
        color: "#4c566a",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "rgba(76, 86, 106, 0.3)",
    },
    ".cm-header": {
        color: "#88c0d0",
        fontWeight: "bold",
    },
    ".cm-strong": {
        color: "#bf616a",
        fontWeight: "bold",
    },
    ".cm-em": {
        color: "#ebcb8b",
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "#81a1c1",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "#3b4252",
        color: "#a3be8c",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "#616e88",
        fontStyle: "italic",
    },
}, { dark: true })

// Solarized Light
export const solarizedLightTheme = EditorView.theme({
    "&": {
        backgroundColor: "#fdf6e3",
        color: "#657b83",
    },
    ".cm-content": {
        caretColor: "#586e75",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "#586e75",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "#eee8d5",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "#eee8d5",
    },
    ".cm-activeLine": {
        backgroundColor: "#eee8d5",
    },
    ".cm-gutters": {
        backgroundColor: "#eee8d5",
        color: "#93a1a1",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "#eee8d5",
    },
    ".cm-header": {
        color: "#268bd2",
        fontWeight: "bold",
    },
    ".cm-strong": {
        color: "#dc322f",
        fontWeight: "bold",
    },
    ".cm-em": {
        color: "#b58900",
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "#2aa198",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "#eee8d5",
        color: "#859900",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "#93a1a1",
        fontStyle: "italic",
    },
}, { dark: false })

// Solarized Dark
export const solarizedDarkTheme = EditorView.theme({
    "&": {
        backgroundColor: "#002b36",
        color: "#839496",
    },
    ".cm-content": {
        caretColor: "#93a1a1",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "#93a1a1",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "#073642",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "#073642",
    },
    ".cm-activeLine": {
        backgroundColor: "#073642",
    },
    ".cm-gutters": {
        backgroundColor: "#073642",
        color: "#586e75",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "#073642",
    },
    ".cm-header": {
        color: "#268bd2",
        fontWeight: "bold",
    },
    ".cm-strong": {
        color: "#dc322f",
        fontWeight: "bold",
    },
    ".cm-em": {
        color: "#b58900",
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "#2aa198",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "#073642",
        color: "#859900",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "#586e75",
        fontStyle: "italic",
    },
}, { dark: true })

// Theme map
export const themes = {
    'default': defaultTheme,
    'github-light': githubLightTheme,
    'github-dark': githubDarkTheme,
    'monokai': monokaiTheme,
    'dracula': draculaTheme,
    'nord': nordTheme,
    'solarized-light': solarizedLightTheme,
    'solarized-dark': solarizedDarkTheme,
}
