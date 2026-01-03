import { EditorView, basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { vim } from '@replit/codemirror-vim'

const themeCompartment = new Compartment()
const highlightCompartment = new Compartment()
const vimCompartment = new Compartment()
const wrapCompartment = new Compartment()
const lintCompartment = new Compartment()

function themeFor(name, palette) {
    const isDark = palette === 'dark' || palette === 'theme'

    // Editor chrome (background, gutters, selection, caret)
    const base = {
        "&": {
            height: "100%",
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            color: isDark ? "#d4d4d4" : "#24292f",
        },
        ".cm-content": {
            caretColor: isDark ? "#569cd6" : "#0969da",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        },
        ".cm-cursor": {
            borderLeftColor: isDark ? "#569cd6" : "#0969da",
        },
        ".cm-selectionBackground, ::selection": {
            backgroundColor: isDark ? "rgba(128, 203, 196, 0.25)" : "rgba(9, 105, 218, 0.15)",
        },
        "&.cm-focused .cm-selectionBackground": {
            backgroundColor: isDark ? "rgba(128, 203, 196, 0.35)" : "rgba(9, 105, 218, 0.22)",
        },
        ".cm-activeLine": {
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
        },
        ".cm-gutters": {
            backgroundColor: isDark ? "#252526" : "#f6f8fa",
            color: isDark ? "#858585" : "#57606a",
            border: "none",
        },
        ".cm-activeLineGutter": {
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
        },
    }

    // Syntax colors (HighlightStyle)
    if (name === 'github') {
        const style = HighlightStyle.define([
            { tag: tags.heading, color: "#0969da", fontWeight: "bold" },
            { tag: tags.strong, fontWeight: "bold" },
            { tag: tags.emphasis, fontStyle: "italic" },
            { tag: tags.link, color: "#0969da", textDecoration: "underline" },
            { tag: tags.keyword, color: "#cf222e" },
            { tag: tags.string, color: "#0a3069" },
            { tag: tags.comment, color: "#6e7781", fontStyle: "italic" },
            { tag: tags.atom, color: "#0550ae" },
            { tag: tags.number, color: "#0550ae" },
            { tag: tags.bool, color: "#0550ae" },
            { tag: tags.variableName, color: "#24292f" },
            { tag: tags.function(tags.variableName), color: "#8250df" },
            { tag: tags.typeName, color: "#953800" },
            { tag: tags.punctuation, color: "#24292f" },
        ])
        return {
            theme: EditorView.theme(base, { dark: false }),
            highlight: syntaxHighlighting(style, { fallback: true }),
        }
    }

    if (name === 'monokai') {
        const style = HighlightStyle.define([
            { tag: tags.heading, color: "#a6e22e", fontWeight: "bold" },
            { tag: tags.strong, fontWeight: "bold" },
            { tag: tags.emphasis, fontStyle: "italic" },
            { tag: tags.link, color: "#66d9ef", textDecoration: "underline" },
            { tag: tags.keyword, color: "#f92672" },
            { tag: tags.string, color: "#e6db74" },
            { tag: tags.comment, color: "#75715e", fontStyle: "italic" },
            { tag: tags.atom, color: "#ae81ff" },
            { tag: tags.number, color: "#ae81ff" },
            { tag: tags.bool, color: "#ae81ff" },
            { tag: tags.variableName, color: "#f8f8f2" },
            { tag: tags.function(tags.variableName), color: "#a6e22e" },
            { tag: tags.typeName, color: "#66d9ef" },
            { tag: tags.punctuation, color: "#f8f8f2" },
        ])
        const darkBase = {
            ...base,
            "&": {
                ...base["&"],
                backgroundColor: "#272822",
                color: "#f8f8f2",
            },
            ".cm-gutters": {
                ...base[".cm-gutters"],
                backgroundColor: "#2d2e27",
                color: "#75715e",
            },
        }
        return {
            theme: EditorView.theme(darkBase, { dark: true }),
            highlight: syntaxHighlighting(style, { fallback: true }),
        }
    }

    if (name === 'dracula') {
        const style = HighlightStyle.define([
            { tag: tags.heading, color: "#50fa7b", fontWeight: "bold" },
            { tag: tags.strong, fontWeight: "bold" },
            { tag: tags.emphasis, fontStyle: "italic" },
            { tag: tags.link, color: "#8be9fd", textDecoration: "underline" },
            { tag: tags.keyword, color: "#ff79c6" },
            { tag: tags.string, color: "#f1fa8c" },
            { tag: tags.comment, color: "#6272a4", fontStyle: "italic" },
            { tag: tags.atom, color: "#bd93f9" },
            { tag: tags.number, color: "#bd93f9" },
            { tag: tags.bool, color: "#bd93f9" },
            { tag: tags.variableName, color: "#f8f8f2" },
            { tag: tags.function(tags.variableName), color: "#50fa7b" },
            { tag: tags.typeName, color: "#8be9fd" },
            { tag: tags.punctuation, color: "#f8f8f2" },
        ])
        const draculaBase = {
            ...base,
            "&": {
                ...base["&"],
                backgroundColor: "#282a36",
                color: "#f8f8f2",
            },
            ".cm-gutters": {
                ...base[".cm-gutters"],
                backgroundColor: "#21222c",
                color: "#6272a4",
            },
        }
        return {
            theme: EditorView.theme(draculaBase, { dark: true }),
            highlight: syntaxHighlighting(style, { fallback: true }),
        }
    }

    if (name === 'nord') {
        const style = HighlightStyle.define([
            { tag: tags.heading, color: "#88c0d0", fontWeight: "bold" },
            { tag: tags.strong, fontWeight: "bold" },
            { tag: tags.emphasis, fontStyle: "italic" },
            { tag: tags.link, color: "#88c0d0", textDecoration: "underline" },
            { tag: tags.keyword, color: "#81a1c1" },
            { tag: tags.string, color: "#a3be8c" },
            { tag: tags.comment, color: "#616e88", fontStyle: "italic" },
            { tag: tags.atom, color: "#b48ead" },
            { tag: tags.number, color: "#b48ead" },
            { tag: tags.bool, color: "#81a1c1" },
            { tag: tags.variableName, color: "#d8dee9" },
            { tag: tags.function(tags.variableName), color: "#88c0d0" },
            { tag: tags.typeName, color: "#8fbcbb" },
            { tag: tags.punctuation, color: "#d8dee9" },
        ])
        const nordBase = {
            ...base,
            "&": {
                ...base["&"],
                backgroundColor: "#2e3440",
                color: "#d8dee9",
            },
            ".cm-gutters": {
                ...base[".cm-gutters"],
                backgroundColor: "#3b4252",
                color: "#616e88",
            },
        }
        return {
            theme: EditorView.theme(nordBase, { dark: true }),
            highlight: syntaxHighlighting(style, { fallback: true }),
        }
    }

    if (name === 'solarized-dark') {
        const style = HighlightStyle.define([
            { tag: tags.heading, color: "#268bd2", fontWeight: "bold" },
            { tag: tags.strong, fontWeight: "bold" },
            { tag: tags.emphasis, fontStyle: "italic" },
            { tag: tags.link, color: "#268bd2", textDecoration: "underline" },
            { tag: tags.keyword, color: "#859900" },
            { tag: tags.string, color: "#2aa198" },
            { tag: tags.comment, color: "#586e75", fontStyle: "italic" },
            { tag: tags.atom, color: "#cb4b16" },
            { tag: tags.number, color: "#d33682" },
            { tag: tags.bool, color: "#268bd2" },
            { tag: tags.variableName, color: "#839496" },
            { tag: tags.function(tags.variableName), color: "#268bd2" },
            { tag: tags.typeName, color: "#b58900" },
            { tag: tags.punctuation, color: "#839496" },
        ])
        const solarizedBase = {
            ...base,
            "&": {
                ...base["&"],
                backgroundColor: "#002b36",
                color: "#839496",
            },
            ".cm-gutters": {
                ...base[".cm-gutters"],
                backgroundColor: "#073642",
                color: "#586e75",
            },
        }
        return {
            theme: EditorView.theme(solarizedBase, { dark: true }),
            highlight: syntaxHighlighting(style, { fallback: true }),
        }
    }

    if (name === 'solarized-light') {
        const style = HighlightStyle.define([
            { tag: tags.heading, color: "#268bd2", fontWeight: "bold" },
            { tag: tags.strong, fontWeight: "bold" },
            { tag: tags.emphasis, fontStyle: "italic" },
            { tag: tags.link, color: "#268bd2", textDecoration: "underline" },
            { tag: tags.keyword, color: "#859900" },
            { tag: tags.string, color: "#2aa198" },
            { tag: tags.comment, color: "#93a1a1", fontStyle: "italic" },
            { tag: tags.atom, color: "#cb4b16" },
            { tag: tags.number, color: "#d33682" },
            { tag: tags.bool, color: "#268bd2" },
            { tag: tags.variableName, color: "#657b83" },
            { tag: tags.function(tags.variableName), color: "#268bd2" },
            { tag: tags.typeName, color: "#b58900" },
            { tag: tags.punctuation, color: "#657b83" },
        ])
        const solarizedLightBase = {
            ...base,
            "&": {
                ...base["&"],
                backgroundColor: "#fdf6e3",
                color: "#657b83",
            },
            ".cm-gutters": {
                ...base[".cm-gutters"],
                backgroundColor: "#eee8d5",
                color: "#93a1a1",
            },
        }
        return {
            theme: EditorView.theme(solarizedLightBase, { dark: false }),
            highlight: syntaxHighlighting(style, { fallback: true }),
        }
    }

    if (name === 'onedark') {
        const style = HighlightStyle.define([
            { tag: tags.heading, color: "#61afef", fontWeight: "bold" },
            { tag: tags.strong, fontWeight: "bold" },
            { tag: tags.emphasis, fontStyle: "italic" },
            { tag: tags.link, color: "#61afef", textDecoration: "underline" },
            { tag: tags.keyword, color: "#c678dd" },
            { tag: tags.string, color: "#98c379" },
            { tag: tags.comment, color: "#5c6370", fontStyle: "italic" },
            { tag: tags.atom, color: "#d19a66" },
            { tag: tags.number, color: "#d19a66" },
            { tag: tags.bool, color: "#61afef" },
            { tag: tags.variableName, color: "#abb2bf" },
            { tag: tags.function(tags.variableName), color: "#61afef" },
            { tag: tags.typeName, color: "#e5c07b" },
            { tag: tags.punctuation, color: "#abb2bf" },
        ])
        const onedarkBase = {
            ...base,
            "&": {
                ...base["&"],
                backgroundColor: "#282c34",
                color: "#abb2bf",
            },
            ".cm-gutters": {
                ...base[".cm-gutters"],
                backgroundColor: "#21252b",
                color: "#5c6370",
            },
        }
        return {
            theme: EditorView.theme(onedarkBase, { dark: true }),
            highlight: syntaxHighlighting(style, { fallback: true }),
        }
    }

    // default
    const style = HighlightStyle.define([
        { tag: tags.heading, color: isDark ? "#569cd6" : "#0969da", fontWeight: "bold" },
        { tag: tags.strong, fontWeight: "bold" },
        { tag: tags.emphasis, fontStyle: "italic" },
        { tag: tags.link, color: isDark ? "#4fc1ff" : "#0969da", textDecoration: "underline" },
        { tag: tags.keyword, color: isDark ? "#c586c0" : "#cf222e" },
        { tag: tags.string, color: isDark ? "#ce9178" : "#0a3069" },
        { tag: tags.comment, color: isDark ? "#6a9955" : "#6e7781", fontStyle: "italic" },
        { tag: tags.atom, color: isDark ? "#dcdcaa" : "#0550ae" },
        { tag: tags.number, color: isDark ? "#b5cea8" : "#0550ae" },
        { tag: tags.bool, color: isDark ? "#569cd6" : "#0550ae" },
    ])
    return {
        theme: EditorView.theme(base, { dark: isDark }),
        highlight: syntaxHighlighting(style, { fallback: true }),
    }
}

export function createEditor(parent, content = '', callbacks = {}) {
    const initial = themeFor('default', 'dark')

    const state = EditorState.create({
        doc: content,
        extensions: [
            basicSetup,
            markdown(),
            themeCompartment.of(initial.theme),
            highlightCompartment.of(initial.highlight),
            vimCompartment.of([]),
            wrapCompartment.of([]),
            lintCompartment.of([]),
            history(),
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                ...searchKeymap,
            ]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged && callbacks.onChange) {
                    callbacks.onChange(update.state.doc.toString())
                }
                if (update.selectionSet && callbacks.onCursorChange) {
                    const pos = update.state.selection.main.head
                    const line = update.state.doc.lineAt(pos)
                    callbacks.onCursorChange({
                        line: line.number,
                        col: pos - line.from + 1,
                        chars: update.state.doc.length
                    })
                }
            })
        ]
    })

    const view = new EditorView({
        state,
        parent
    })

    return view
}

export function setEditorContent(view, content) {
    view.dispatch({
        changes: {
            from: 0,
            to: view.state.doc.length,
            insert: content
        }
    })
}

export function getEditorContent(view) {
    return view.state.doc.toString()
}

export function insertAtCursor(view, text) {
    const pos = view.state.selection.main.head
    view.dispatch({
        changes: { from: pos, insert: text },
        selection: { anchor: pos + text.length }
    })
    view.focus()
}

export function wrapSelection(view, before, after) {
    const sel = view.state.selection.main
    const text = view.state.sliceDoc(sel.from, sel.to)

    if (text.length === 0) {
        // No selection, insert markers and place cursor between them
        view.dispatch({
            changes: { from: sel.from, insert: before + after },
            selection: { anchor: sel.from + before.length }
        })
    } else {
        // Wrap selection
        view.dispatch({
            changes: { from: sel.from, to: sel.to, insert: before + text + after },
            selection: {
                anchor: sel.from + before.length,
                head: sel.from + before.length + text.length
            }
        })
    }
    view.focus()
}

export function setFontScale(view, scale) {
    // Update CSS variable
    document.documentElement.style.setProperty('--font-scale', scale / 100)
}

export function setTheme(view, themeName, palette) {
    if (!view) return
    const { theme, highlight } = themeFor(themeName || 'default', palette || 'dark')
    view.dispatch({
        effects: [
            themeCompartment.reconfigure(theme),
            highlightCompartment.reconfigure(highlight),
        ]
    })
}

export function setVimMode(view, enabled) {
    if (!view) return
    view.dispatch({
        effects: vimCompartment.reconfigure(enabled ? vim() : [])
    })
}

export function setWordWrap(view, enabled) {
    if (!view) return
    view.dispatch({
        effects: wrapCompartment.reconfigure(enabled ? EditorView.lineWrapping : [])
    })
}

export function setLintEnabled(view, enabled) {
    if (!view) return
    view.dispatch({
        effects: lintCompartment.reconfigure(enabled ? lintExtension : [])
    })
}
