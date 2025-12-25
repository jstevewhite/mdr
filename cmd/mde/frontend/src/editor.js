import { EditorView, basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const themeCompartment = new Compartment()
const highlightCompartment = new Compartment()

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
