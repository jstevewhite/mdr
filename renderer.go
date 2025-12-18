package main

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
	"github.com/yuin/goldmark/text"
)

type renderTheme string

const (
	themeLight renderTheme = "light"
	themeDark  renderTheme = "dark"
)

type paletteMode string

const (
	paletteTheme paletteMode = "theme"
	paletteLight paletteMode = paletteMode(themeLight)
	paletteDark  paletteMode = paletteMode(themeDark)
)

// TOCItem represents a table of contents entry
type TOCItem struct {
	ID    string `json:"id"`
	Text  string `json:"text"`
	Level int    `json:"level"`
}

// generateID creates a URL-friendly ID from text
func generateID(text string) string {
	// Convert to lowercase and replace spaces/special chars with hyphens
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	id := reg.ReplaceAllString(strings.ToLower(text), "-")
	id = strings.Trim(id, "-")
	return id
}

func normalizeTheme(name string) renderTheme {
	switch renderTheme(name) {
	case themeDark:
		return themeDark
	default:
		return themeLight
	}
}

func themeCSS(t renderTheme) string {
	switch t {
	case themeDark:
		return "html,body{background:#0d1117;color:#c9d1d9}a{color:#58a6ff}pre,code{background:#161b22}blockquote{color:#8b949e;border-left:4px solid #30363d}hr{border:0;border-top:1px solid #30363d}table{border-collapse:collapse}th,td{border:1px solid #30363d;padding:6px 10px}"
	default:
		return "html,body{background:#ffffff;color:#1f2328}a{color:#0969da}pre,code{background:#f6f8fa}blockquote{color:#57606a;border-left:4px solid #d0d7de}hr{border:0;border-top:1px solid #d0d7de}table{border-collapse:collapse}th,td{border:1px solid #d0d7de;padding:6px 10px}"
	}
}

func normalizePalette(p string) paletteMode {
	switch paletteMode(strings.TrimSpace(p)) {
	case paletteTheme:
		return paletteTheme
	case paletteDark:
		return paletteDark
	default:
		return paletteLight
	}
}

func paletteCSSByMode(p paletteMode) string {
	switch p {
	case paletteDark:
		return "html,body{background:#0d1117;color:#c9d1d9}#wrapper{color:#c9d1d9}#wrapper p,#wrapper td,#wrapper div,#wrapper li,#wrapper h1,#wrapper h2,#wrapper h3,#wrapper h4,#wrapper h5,#wrapper h6,#wrapper th,#wrapper caption,#wrapper dt,#wrapper dd,#wrapper span{color:inherit}#wrapper a{color:#58a6ff}#wrapper pre,#wrapper code{background:#161b22}#wrapper blockquote{color:#8b949e;border-left:4px solid #30363d}#wrapper hr{border:0;border-top:1px solid #30363d}#wrapper table{border-collapse:collapse}#wrapper th,#wrapper td{border:1px solid #30363d;padding:6px 10px}#wrapper figcaption{background:transparent;color:inherit}"
	case paletteTheme:
		return ""
	default:
		return "html,body{background:#ffffff;color:#1f2328}#wrapper{color:#1f2328}#wrapper p,#wrapper td,#wrapper div,#wrapper li,#wrapper h1,#wrapper h2,#wrapper h3,#wrapper h4,#wrapper h5,#wrapper h6,#wrapper th,#wrapper caption,#wrapper dt,#wrapper dd,#wrapper span{color:inherit}#wrapper a{color:#0969da}#wrapper pre,#wrapper code{background:#f6f8fa}#wrapper blockquote{color:#57606a;border-left:4px solid #d0d7de}#wrapper hr{border:0;border-top:1px solid #d0d7de}#wrapper table{border-collapse:collapse}#wrapper th,#wrapper td{border:1px solid #d0d7de;padding:6px 10px}#wrapper figcaption{background:transparent;color:inherit}"
	}
}

func themeCSSByName(themeName string) string {
	themeName = strings.TrimSpace(themeName)
	if themeName == "" {
		return ""
	}

	if themeName == "default" {
		return ""
	}

	dir, err := themesDir()
	if err != nil {
		return ""
	}

	name := filepath.Base(themeName)
	if !strings.HasSuffix(strings.ToLower(name), ".css") {
		name += ".css"
	}
	path := filepath.Join(dir, name)

	b, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return string(b)
}

// RenderOutput contains both the HTML and TOC
type RenderOutput struct {
	HTML string
	TOC  []TOCItem
}

// extractTOC walks the AST and extracts heading information
func extractTOC(source []byte, node ast.Node) []TOCItem {
	var items []TOCItem
	ast.Walk(node, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}

		if heading, ok := n.(*ast.Heading); ok {
			// Extract text content
			var textBuf bytes.Buffer
			for c := heading.FirstChild(); c != nil; c = c.NextSibling() {
				if textNode, ok := c.(*ast.Text); ok {
					textBuf.Write(textNode.Segment.Value(source))
				} else if c.Kind() == ast.KindString {
					textBuf.Write(c.Text(source))
				}
			}

			text := textBuf.String()
			if text != "" {
				id := generateID(text)
				// Set ID attribute on the heading
				heading.SetAttributeString("id", []byte(id))

				items = append(items, TOCItem{
					ID:    id,
					Text:  text,
					Level: heading.Level,
				})
			}
		}

		return ast.WalkContinue, nil
	})

	return items
}

// RenderMarkdownWithTOC renders markdown and returns HTML with TOC
func RenderMarkdownWithTOC(markdown string, themeName string, palette string, fontScale int) (RenderOutput, error) {
	md := goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			extension.Table,
			extension.Strikethrough,
			extension.TaskList,
			extension.Linkify,
		),
		goldmark.WithRendererOptions(
			html.WithUnsafe(),
		),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(),
		),
	)

	source := []byte(markdown)
	doc := md.Parser().Parse(text.NewReader(source))

	// Extract TOC before rendering
	toc := extractTOC(source, doc)

	var buf bytes.Buffer
	if err := md.Renderer().Render(&buf, source, doc); err != nil {
		return RenderOutput{}, err
	}

	layoutCSS := themeCSSByName(themeName)
	pMode := normalizePalette(palette)
	palCSS := paletteCSSByMode(pMode)
	if fontScale < 50 {
		fontScale = 50
	}
	if fontScale > 200 {
		fontScale = 200
	}

	baseCSS := fmt.Sprintf("body{margin:0}img{max-width:100%%}pre{overflow:auto}#wrapper{font-size:%d%% !important;padding:32px;max-width:900px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Helvetica Neue,Arial,sans-serif;line-height:1.55}pre{padding:12px;border-radius:8px}code{padding:2px 4px;border-radius:6px}blockquote{margin:0 0 16px 0;padding:0 0 0 14px}table{width:100%%}", fontScale)

	page := fmt.Sprintf("<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><style>%s%s%s</style></head><body class=\"palette-%s\"><div id=\"wrapper\">{{.Body}}</div></body></html>", baseCSS, layoutCSS, palCSS, pMode)

	tmpl, err := template.New("page").Parse(page)
	if err != nil {
		return RenderOutput{}, err
	}

	var out bytes.Buffer
	if err := tmpl.Execute(&out, map[string]any{"Body": template.HTML(buf.String())}); err != nil {
		return RenderOutput{}, err
	}

	return RenderOutput{
		HTML: out.String(),
		TOC:  toc,
	}, nil
}

func RenderMarkdownToHTMLDocument(markdown string, themeName string, palette string, fontScale int) (string, error) {
	output, err := RenderMarkdownWithTOC(markdown, themeName, palette, fontScale)
	return output.HTML, err
}
