import { linter, Diagnostic } from '@codemirror/lint'
import markdownIt from 'markdown-it'

const md = markdownIt()

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
		
		if (line.trim().startsWith('#')) {
			if (!line.trim().startsWith('# ') && !line.trim().startsWith('## ') && !line.trim().startsWith('### ') && !line.trim().startsWith('#### ') && !line.trim().startsWith('##### ') && !line.trim().startsWith('###### ')) {
				const from = view.state.doc.line(i).from
				const to = view.state.doc.line(i).to
				diagnostics.push({
					from: from,
					to: to,
					severity: 'warning',
					message: 'Heading should have a space after the # symbol',
					source: 'mde-linter'
				})
			}
		}
		
		if (line.includes('\t')) {
			const from = view.state.doc.line(i).from
			const to = view.state.doc.line(i).to
			diagnostics.push({
				from: from,
				to: to,
				severity: 'warning',
				message: 'Hard tabs are discouraged; use spaces',
				source: 'mde-linter'
			})
		}
		
		if (line.length > 80 && !line.startsWith('#') && !line.trim().startsWith('```')) {
			const from = view.state.doc.line(i).from
			const to = view.state.doc.line(i).to
			diagnostics.push({
				from: from,
				to: to,
				severity: 'warning',
				message: 'Line exceeds 80 characters',
				source: 'mde-linter'
			})
		}
		
		if (line.match(/\[.*\]\(https?:\/\//) && !line.includes('\]: ')) {
			const from = view.state.doc.line(i).from
			const to = view.state.doc.line(i).to
			diagnostics.push({
				from: from,
				to: to,
				severity: 'error',
				message: 'URL link should have descriptive text',
				source: 'mde-linter'
			})
		}
		
		const emptyListMatch = line.match(/^(\s*[-*+]|\s*\d+[.)]\s*$/)
		if (emptyListMatch) {
			const from = view.state.doc.line(i).from
			const to = view.state.doc.line(i).to
			diagnostics.push({
				from: from,
				to: to,
				severity: 'warning',
				message: 'Empty list item',
				source: 'mde-linter'
			})
		}
	}
	
	return diagnostics
}, {
	delay: 500
})

export { lintExtension }
