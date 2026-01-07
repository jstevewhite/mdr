import { EditorView, basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { vim } from '@replit/codemirror-vim'
import { linter, lintGutter } from '@codemirror/lint'

const themeCompartment = new Compartment()
const highlightCompartment = new Compartment()
const vimCompartment = new Compartment()
const wrapCompartment = new Compartment()
const lintCompartment = new Compartment()

const lintExtension = linter((view) => {
    const content = view.state.doc.toString()

    if (!content.trim()) {
        return []
    }

    const diagnostics = []
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNum = i + 1
        const lineInfo = view.state.doc.line(lineNum)
        const from = lineInfo.from
        const to = lineInfo.to

        // MD018: No space after hash on ATX-style heading
        const headingMatch = line.match(/^(\s{0,3})(#{1,6})([^\s#].*)$/)
        if (headingMatch) {
            const indent = headingMatch[1]
            const hashes = headingMatch[2]
            const rest = headingMatch[3]
            diagnostics.push({
                from: from,
                to: to,
                severity: 'warning',
                message: 'MD018: No space after hash on ATX-style heading',
                source: 'markdown-lint',
                actions: [{
                    name: 'Add space',
                    apply(view, from, to) {
                        view.dispatch({
                            changes: { from, to, insert: `${indent}${hashes} ${rest}` }
                        })
                    }
                }]
            })
        }

        // MD019: Multiple spaces after hash on ATX-style heading
        const multiSpaceHeading = line.match(/^(\s{0,3})(#{1,6})\s{2,}(.*)$/)
        if (multiSpaceHeading) {
            const indent = multiSpaceHeading[1]
            const hashes = multiSpaceHeading[2]
            const rest = multiSpaceHeading[3]
            diagnostics.push({
                from: from,
                to: to,
                severity: 'info',
                message: 'MD019: Multiple spaces after hash on ATX-style heading',
                source: 'markdown-lint',
                actions: [{
                    name: 'Fix spacing',
                    apply(view, from, to) {
                        view.dispatch({
                            changes: { from, to, insert: `${indent}${hashes} ${rest}` }
                        })
                    }
                }]
            })
        }

        // MD009: Trailing spaces
        if (line.match(/\s+$/) && line.length > 0) {
            const trimmed = line.replace(/\s+$/, '')
            diagnostics.push({
                from: from + trimmed.length,
                to: to,
                severity: 'info',
                message: 'MD009: Trailing spaces',
                source: 'markdown-lint',
                actions: [{
                    name: 'Remove',
                    apply(view, from, to) {
                        view.dispatch({
                            changes: { from, to, insert: '' }
                        })
                    }
                }]
            })
        }

        // MD012: Multiple consecutive blank lines
        if (i > 0 && line === '' && lines[i - 1] === '') {
            let consecutiveBlankCount = 0
            for (let j = i; j >= 0 && lines[j] === ''; j--) {
                consecutiveBlankCount++
            }
            if (consecutiveBlankCount > 1 && lines[i - 1] === '') {
                diagnostics.push({
                    from: from,
                    to: to,
                    severity: 'info',
                    message: 'MD012: Multiple consecutive blank lines',
                    source: 'markdown-lint',
                    actions: [{
                        name: 'Remove',
                        apply(view, from, to) {
                            // Remove the entire line including newline
                            view.dispatch({
                                changes: { from: from - 1, to: to }
                            })
                        }
                    }]
                })
            }
        }

        // MD030: Spaces after list markers
        const listMatch = line.match(/^(\s*)([*\-+]|\d+\.)\s{2,}(.*)$/)
        if (listMatch) {
            const indent = listMatch[1]
            const marker = listMatch[2]
            const rest = listMatch[3]
            diagnostics.push({
                from: from,
                to: to,
                severity: 'info',
                message: 'MD030: Spaces after list markers should be consistent (use 1 space)',
                source: 'markdown-lint',
                actions: [{
                    name: 'Fix spacing',
                    apply(view, from, to) {
                        view.dispatch({
                            changes: { from, to, insert: `${indent}${marker} ${rest}` }
                        })
                    }
                }]
            })
        }

        // MD031: Fenced code blocks should be surrounded by blank lines
        if (line.match(/^```/) || line.match(/^~~~/)) {
            const isOpening = !line.match(/^```\s*$/) || line.match(/^```\w/)
            const isClosing = line.match(/^```\s*$/) && i > 0 && !lines[i - 1].match(/^```/)

            if (isOpening && i > 0 && lines[i - 1].trim() !== '') {
                diagnostics.push({
                    from: from,
                    to: to,
                    severity: 'info',
                    message: 'MD031: Fenced code blocks should be surrounded by blank lines',
                    source: 'markdown-lint',
                    actions: [{
                        name: 'Add blank line before',
                        apply(view, from, to) {
                            view.dispatch({
                                changes: { from: from, insert: '\n' }
                            })
                        }
                    }]
                })
            }

            if (isClosing && i < lines.length - 1 && lines[i + 1].trim() !== '') {
                diagnostics.push({
                    from: from,
                    to: to,
                    severity: 'info',
                    message: 'MD031: Fenced code blocks should be surrounded by blank lines',
                    source: 'markdown-lint',
                    actions: [{
                        name: 'Add blank line after',
                        apply(view, from, to) {
                            view.dispatch({
                                changes: { from: to, insert: '\n' }
                            })
                        }
                    }]
                })
            }
        }

        // MD047: Files should end with a single newline character
        if (i === lines.length - 1 && line.length > 0) {
            diagnostics.push({
                from: to,
                to: to,
                severity: 'info',
                message: 'MD047: Files should end with a single newline character',
                source: 'markdown-lint',
                actions: [{
                    name: 'Add newline',
                    apply(view, from, to) {
                        view.dispatch({
                            changes: { from: to, insert: '\n' }
                        })
                    }
                }]
            })
        }
    }

    return diagnostics
}, {
    delay: 500
})

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
        ".cm-tooltip": {
            backgroundColor: isDark ? "#252526" : "#ffffff",
            color: isDark ? "#d4d4d4" : "#24292f",
            border: isDark ? "1px solid #3e3e42" : "1px solid #d0d7de",
            borderRadius: "6px",
        },
        ".cm-tooltip.cm-tooltip-lint": {
            backgroundColor: isDark ? "#252526" : "#ffffff",
            color: isDark ? "#d4d4d4" : "#24292f",
            border: isDark ? "1px solid #3e3e42" : "1px solid #d0d7de",
        },
        ".cm-diagnostic": {
            color: isDark ? "#d4d4d4" : "#24292f",
        },
        ".cm-diagnostic-error": {
            borderLeft: "3px solid #f85149",
        },
        ".cm-diagnostic-warning": {
            borderLeft: "3px solid #d29922",
        },
        ".cm-diagnostic-info": {
            borderLeft: "3px solid #58a6ff",
        },
        ".cm-diagnosticAction": {
            backgroundColor: isDark ? "#0d1117" : "#f6f8fa",
            color: isDark ? "#58a6ff" : "#0969da",
            border: isDark ? "1px solid #3e3e42" : "1px solid #d0d7de",
            borderRadius: "4px",
            padding: "2px 8px",
            fontSize: "12px",
            cursor: "pointer",
        },
        ".cm-diagnosticAction:hover": {
            backgroundColor: isDark ? "#161b22" : "#eff1f3",
        },
    }

    // Syntax colors (HighlightStyle)
    if (name === 'github') {
        const style = HighlightStyle.define([
            { tag: tags.heading, color: "#0969da", fontWeight: "bold" },
            { tag: tags.processingInstruction, color: "#6272a4", fontWeight: "bold" },
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
            highlight: syntaxHighlighting(style),
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
            ".cm-tooltip": {
                ...base[".cm-tooltip"],
                backgroundColor: "#2d2e27",
                color: "#f8f8f2",
                border: "1px solid #3e3e42",
            },
            ".cm-tooltip.cm-tooltip-lint": {
                backgroundColor: "#2d2e27",
                color: "#f8f8f2",
            },
            ".cm-diagnostic": {
                color: "#f8f8f2",
            },
            ".cm-diagnosticAction": {
                ...base[".cm-diagnosticAction"],
                backgroundColor: "#1e1f1c",
                color: "#a6e22e",
            },
            ".cm-diagnosticAction:hover": {
                backgroundColor: "#383830",
            },
        }
        return {
            theme: EditorView.theme(darkBase, { dark: true }),
            highlight: syntaxHighlighting(style),
        }
    }

    if (name === 'dracula') {
        const style = HighlightStyle.define([
            { tag: tags.heading, color: "#50fa7b", fontWeight: "bold" },
            { tag: tags.processingInstruction, color: "#79cfdeff", fontWeight: "bold" },
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
            ".cm-tooltip": {
                ...base[".cm-tooltip"],
                backgroundColor: "#21222c",
                color: "#f8f8f2",
                border: "1px solid #44475a",
            },
            ".cm-tooltip.cm-tooltip-lint": {
                backgroundColor: "#21222c",
                color: "#f8f8f2",
            },
            ".cm-diagnostic": {
                color: "#f8f8f2",
            },
            ".cm-diagnosticAction": {
                ...base[".cm-diagnosticAction"],
                backgroundColor: "#282a36",
                color: "#50fa7b",
            },
            ".cm-diagnosticAction:hover": {
                backgroundColor: "#44475a",
            },
        }
        return {
            theme: EditorView.theme(draculaBase, { dark: true }),
            highlight: syntaxHighlighting(style),
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
            ".cm-tooltip": {
                ...base[".cm-tooltip"],
                backgroundColor: "#3b4252",
                color: "#d8dee9",
                border: "1px solid #4c566a",
            },
            ".cm-tooltip.cm-tooltip-lint": {
                backgroundColor: "#3b4252",
                color: "#d8dee9",
            },
            ".cm-diagnostic": {
                color: "#d8dee9",
            },
            ".cm-diagnosticAction": {
                ...base[".cm-diagnosticAction"],
                backgroundColor: "#2e3440",
                color: "#88c0d0",
            },
            ".cm-diagnosticAction:hover": {
                backgroundColor: "#434c5e",
            },
        }
        return {
            theme: EditorView.theme(nordBase, { dark: true }),
            highlight: syntaxHighlighting(style),
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
            ".cm-tooltip": {
                ...base[".cm-tooltip"],
                backgroundColor: "#073642",
                color: "#839496",
                border: "1px solid #094d5e",
            },
            ".cm-tooltip.cm-tooltip-lint": {
                backgroundColor: "#073642",
                color: "#839496",
            },
            ".cm-diagnostic": {
                color: "#839496",
            },
            ".cm-diagnosticAction": {
                ...base[".cm-diagnosticAction"],
                backgroundColor: "#002b36",
                color: "#268bd2",
            },
            ".cm-diagnosticAction:hover": {
                backgroundColor: "#094d5e",
            },
        }
        return {
            theme: EditorView.theme(solarizedBase, { dark: true }),
            highlight: syntaxHighlighting(style),
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
            ".cm-tooltip": {
                ...base[".cm-tooltip"],
                backgroundColor: "#eee8d5",
                color: "#657b83",
                border: "1px solid #d3cbb7",
            },
            ".cm-tooltip.cm-tooltip-lint": {
                backgroundColor: "#eee8d5",
                color: "#657b83",
            },
            ".cm-diagnostic": {
                color: "#657b83",
            },
            ".cm-diagnosticAction": {
                ...base[".cm-diagnosticAction"],
                backgroundColor: "#fdf6e3",
                color: "#268bd2",
            },
            ".cm-diagnosticAction:hover": {
                backgroundColor: "#e4ddc7",
            },
        }
        return {
            theme: EditorView.theme(solarizedLightBase, { dark: false }),
            highlight: syntaxHighlighting(style),
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
            ".cm-tooltip": {
                ...base[".cm-tooltip"],
                backgroundColor: "#21252b",
                color: "#abb2bf",
                border: "1px solid #3e4451",
            },
            ".cm-tooltip.cm-tooltip-lint": {
                backgroundColor: "#21252b",
                color: "#abb2bf",
            },
            ".cm-diagnostic": {
                color: "#abb2bf",
            },
            ".cm-diagnosticAction": {
                ...base[".cm-diagnosticAction"],
                backgroundColor: "#282c34",
                color: "#61afef",
            },
            ".cm-diagnosticAction:hover": {
                backgroundColor: "#2c313a",
            },
        }
        return {
            theme: EditorView.theme(onedarkBase, { dark: true }),
            highlight: syntaxHighlighting(style),
        }
    }

    // default
    const style = HighlightStyle.define([
        { tag: tags.heading, color: isDark ? "#569cd6" : "#0969da", fontWeight: "bold" },
        { tag: tags.processingInstruction, color: isDark ? "#79cfde" : "#0550ae", fontWeight: "bold" },
        { tag: tags.strong, fontWeight: "bold" },
        { tag: tags.emphasis, fontStyle: "italic" },
        { tag: tags.link, color: isDark ? "#4fc1ff" : "#0969da", textDecoration: "underline" },
        { tag: tags.keyword, color: isDark ? "#c586c0" : "#cf222e" },
        { tag: tags.string, color: isDark ? "#ce9178" : "#0a3069" },
        { tag: tags.comment, color: isDark ? "#6a9955" : "#6e7781", fontStyle: "italic" },
        { tag: tags.atom, color: isDark ? "#dcdcaa" : "#0550ae" },
        { tag: tags.number, color: isDark ? "#b5cea8" : "#0550ae" },
        { tag: tags.bool, color: isDark ? "#569cd6" : "#0550ae" },
        { tag: tags.variableName, color: isDark ? "#d4d4d4" : "#24292f" },
        { tag: tags.function(tags.variableName), color: isDark ? "#dcdcaa" : "#8250df" },
        { tag: tags.typeName, color: isDark ? "#4ec9b0" : "#953800" },
        { tag: tags.punctuation, color: isDark ? "#d4d4d4" : "#24292f" },
    ])
    return {
        theme: EditorView.theme(base, { dark: isDark }),
        highlight: syntaxHighlighting(style),
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
        effects: lintCompartment.reconfigure(enabled ? [lintExtension, lintGutter()] : [])
    })
}
