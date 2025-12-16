package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx        context.Context
	launchArgs []string
	watcher    *fsnotify.Watcher
	watchedFile string
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
	Path string    `json:"path"`
	HTML string    `json:"html"`
	TOC  []TOCItem `json:"toc"`
}

func (a *App) RenderMarkdown(markdown string, theme string) (string, error) {
	return RenderMarkdownToHTMLDocument(markdown, theme, getPaletteFromConfig(), getFontScaleFromConfig())
}

func (a *App) RenderMarkdownWithPalette(markdown string, theme string, palette string) (string, error) {
	return RenderMarkdownToHTMLDocument(markdown, theme, palette, getFontScaleFromConfig())
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

func (a *App) GetFontScale() int {
	return getFontScaleFromConfig()
}

func (a *App) SetFontScale(scale int) error {
	return setFontScaleInConfig(scale)
}

func (a *App) GetAutoReload() bool {
	return getAutoReloadFromConfig()
}

func (a *App) SetAutoReload(enabled bool) error {
	return setAutoReloadInConfig(enabled)
}

func (a *App) ListThemes() ([]string, error) {
	items := []string{"default"}

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

	var defaultFirst []string
	for _, it := range uniq {
		if it == "default" {
			continue
		}
		defaultFirst = append(defaultFirst, it)
	}
	sort.Strings(defaultFirst)
	return append([]string{"default"}, defaultFirst...), nil
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
	return RenderMarkdownToHTMLDocument(string(data), theme, palette, getFontScaleFromConfig())
}

// RenderFileWithPaletteAndTOC renders a file and returns HTML with TOC
func (a *App) RenderFileWithPaletteAndTOC(path string, theme string, palette string) (RenderResult, error) {
	path = normalizePath(path)
	data, err := os.ReadFile(path)
	if err != nil {
		return RenderResult{}, err
	}

	output, err := RenderMarkdownWithTOC(string(data), theme, palette, getFontScaleFromConfig())
	if err != nil {
		return RenderResult{}, err
	}

	return RenderResult{
		Path: path,
		HTML: output.HTML,
		TOC:  output.TOC,
	}, nil
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

	result, err := a.RenderFileWithPaletteAndTOC(selection, theme, palette)
	if err != nil {
		return RenderResult{}, err
	}

	return result, nil
}

func (a *App) GetLaunchArgs() []string {
	return a.launchArgs
}

// StartWatchingFile starts watching the specified file for changes
func (a *App) StartWatchingFile(path string) error {
	// Stop watching any previously watched file
	a.StopWatchingFile()

	path = normalizePath(path)
	if path == "" {
		return fmt.Errorf("invalid file path")
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}

	err = watcher.Add(path)
	if err != nil {
		watcher.Close()
		return err
	}

	a.watcher = watcher
	a.watchedFile = path

	// Start goroutine to watch for file changes
	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				// Handle write and create events (some editors use create instead of write)
				if event.Op&fsnotify.Write == fsnotify.Write || event.Op&fsnotify.Create == fsnotify.Create {
					// Emit event to frontend
					runtime.EventsEmit(a.ctx, "file-changed", path)
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				runtime.EventsEmit(a.ctx, "file-watch-error", err.Error())
			}
		}
	}()

	return nil
}

// StopWatchingFile stops watching the current file
func (a *App) StopWatchingFile() {
	if a.watcher != nil {
		a.watcher.Close()
		a.watcher = nil
		a.watchedFile = ""
	}
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
