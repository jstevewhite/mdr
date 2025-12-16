package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx        context.Context
	launchArgs []string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	var args []string
	for _, raw := range os.Args[1:] {
		if strings.HasPrefix(raw, "-psn_") {
			continue
		}
		p := normalizePath(raw)
		if p != "" {
			args = append(args, p)
		}
	}
	a.launchArgs = args
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type RenderResult struct {
	Path string `json:"path"`
	HTML string `json:"html"`
}

func (a *App) RenderMarkdown(markdown string, theme string) (string, error) {
	return RenderMarkdownToHTMLDocument(markdown, theme, getPaletteFromConfig())
}

func (a *App) RenderMarkdownWithPalette(markdown string, theme string, palette string) (string, error) {
	return RenderMarkdownToHTMLDocument(markdown, theme, palette)
}

func (a *App) GetTheme() string {
	return getThemeFromConfig()
}

func (a *App) SetTheme(theme string) error {
	return setThemeInConfig(theme)
}

func (a *App) GetPalette() string {
	return getPaletteFromConfig()
}

func (a *App) SetPalette(palette string) error {
	return setPaletteInConfig(palette)
}

func (a *App) ListThemes() ([]string, error) {
	items := []string{string(themeLight), string(themeDark)}

	dir, err := themesDir()
	if err != nil {
		return items, nil
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return items, nil
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if !strings.HasSuffix(strings.ToLower(name), ".css") {
			continue
		}
		name = strings.TrimSuffix(name, filepath.Ext(name))
		if name == "" {
			continue
		}
		items = append(items, name)
	}

	seen := map[string]struct{}{}
	uniq := make([]string, 0, len(items))
	for _, it := range items {
		if _, ok := seen[it]; ok {
			continue
		}
		seen[it] = struct{}{}
		uniq = append(uniq, it)
	}

	sort.Strings(uniq)
	return uniq, nil
}

func (a *App) RenderFile(path string, theme string) (string, error) {
	return a.RenderFileWithPalette(path, theme, getPaletteFromConfig())
}

func (a *App) RenderFileWithPalette(path string, theme string, palette string) (string, error) {
	path = normalizePath(path)
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return RenderMarkdownToHTMLDocument(string(data), theme, palette)
}

func (a *App) OpenAndRender(theme string, palette string) (RenderResult, error) {
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open Markdown",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Markdown (*.md;*.markdown)",
				Pattern:     "*.md;*.markdown",
			},
		},
	})
	if err != nil {
		return RenderResult{}, err
	}
	if selection == "" {
		return RenderResult{}, nil
	}

	html, err := a.RenderFileWithPalette(selection, theme, palette)
	if err != nil {
		return RenderResult{}, err
	}

	return RenderResult{Path: selection, HTML: html}, nil
}

func (a *App) GetLaunchArgs() []string {
	return a.launchArgs
}

func normalizePath(p string) string {
	p = strings.TrimSpace(p)
	if p == "" {
		return ""
	}

	p = strings.TrimPrefix(p, "file://")

	if p == "~" || strings.HasPrefix(p, "~/") {
		if home, err := os.UserHomeDir(); err == nil {
			if p == "~" {
				p = home
			} else {
				p = filepath.Join(home, strings.TrimPrefix(p, "~/"))
			}
		}
	}

	if !filepath.IsAbs(p) {
		if abs, err := filepath.Abs(p); err == nil {
			p = abs
		}
	}

	return filepath.Clean(p)
}
