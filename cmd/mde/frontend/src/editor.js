import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'

// Theme that uses mdr's CSS variables
const mdrTheme = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "var(--bg-color, #1e1e1e)",
        color: "var(--text-color, #d4d4d4)",
    },
    ".cm-content": {
        caretColor: "var(--accent-color, #569cd6)",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-cursor": {
        borderLeftColor: "var(--accent-color, #569cd6)",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "var(--selection-bg, rgba(128, 203, 196, 0.2))",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "var(--selection-bg, rgba(128, 203, 196, 0.3))",
    },
    ".cm-activeLine": {
        backgroundColor: "var(--active-line-bg, rgba(128, 128, 128, 0.1))",
    },
    ".cm-gutters": {
        backgroundColor: "var(--code-bg, #252526)",
        color: "var(--text-color-muted, #858585)",
        border: "none",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "var(--active-line-bg, rgba(128, 128, 128, 0.1))",
    },
    // Markdown syntax highlighting
    ".cm-header": {
        color: "var(--accent-color, #569cd6)",
        fontWeight: "bold",
    },
    ".cm-strong": {
        fontWeight: "bold",
    },
    ".cm-em": {
        fontStyle: "italic",
    },
    ".cm-link": {
        color: "var(--link-color, #4fc1ff)",
        textDecoration: "underline",
    },
    ".cm-monospace": {
        backgroundColor: "var(--code-bg, #252526)",
        color: "var(--code-color, #ce9178)",
        fontFamily: "inherit",
        padding: "2px 4px",
        borderRadius: "3px",
    },
    ".cm-quote": {
        color: "var(--quote-color, #6a9955)",
        fontStyle: "italic",
    },
}, { dark: true })

export function createEditor(parent, content = '', callbacks = {}) {
    const state = EditorState.create({
        doc: content,
        extensions: [
            basicSetup,
            markdown(),
            mdrTheme,
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
