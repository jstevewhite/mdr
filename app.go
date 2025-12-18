package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	mu               sync.Mutex
	ctx              context.Context
	launchArgs       []string
	pendingFileOpens []string
	watcher          *fsnotify.Watcher
	watchedFile      string
	watchedThemeFile string
	watchedThemeName string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.mu.Lock()
	a.ctx = ctx
	pending := append([]string(nil), a.pendingFileOpens...)
	a.pendingFileOpens = nil
	a.mu.Unlock()
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
	args = append(args, pending...)
	a.mu.Lock()
	a.launchArgs = args
	a.mu.Unlock()
}

func (a *App) handleFileOpen(filePaths []string) {
	var normalized []string
	for _, p := range filePaths {
		np := normalizePath(p)
		if np == "" {
			continue
		}
		normalized = append(normalized, np)
	}
	if len(normalized) == 0 {
		return
	}

	a.mu.Lock()
	a.launchArgs = append(a.launchArgs, normalized...)
	ctx := a.ctx
	if ctx == nil {
		a.pendingFileOpens = append(a.pendingFileOpens, normalized...)
		a.mu.Unlock()
		return
	}
	a.mu.Unlock()

	runtime.EventsEmit(ctx, "file-open", normalized)
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
	if err := setThemeInConfig(theme); err != nil {
		return err
	}
	// If auto-reload is active, refresh the watched theme file.
	a.refreshThemeWatch(theme)
	return nil
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

func (a *App) GetTOCVisible() bool {
	return getTOCVisibleFromConfig()
}

func (a *App) SetTOCVisible(visible bool) error {
	return setTOCVisibleInConfig(visible)
}

func (a *App) GetTOCPinned() bool {
	return getTOCPinnedFromConfig()
}

func (a *App) SetTOCPinned(pinned bool) error {
	return setTOCPinnedInConfig(pinned)
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
	if err := enforceFileLimit(path); err != nil {
		return "", err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return RenderMarkdownToHTMLDocument(string(data), theme, palette, getFontScaleFromConfig())
}

// RenderFileWithPaletteAndTOC renders a file and returns HTML with TOC
func (a *App) RenderFileWithPaletteAndTOC(path string, theme string, palette string) (RenderResult, error) {
	path = normalizePath(path)
	if err := enforceFileLimit(path); err != nil {
		return RenderResult{}, err
	}
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
	a.mu.Lock()
	defer a.mu.Unlock()
	return append([]string(nil), a.launchArgs...)
}

// StartWatchingFile starts watching the specified file for changes
func (a *App) StartWatchingFile(path string) error {
	// Stop watching any previously watched file
	a.StopWatchingFile()

	path = normalizePath(path)
	if path == "" {
		return fmt.Errorf("invalid file path")
	}

	if _, err := os.Stat(path); err != nil {
		return err
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}

	dir := filepath.Dir(path)
	if err := watcher.Add(dir); err != nil {
		watcher.Close()
		return err
	}

	a.watcher = watcher
	a.watchedFile = path

	// Also watch the current theme (if any)
	a.refreshThemeWatch(getThemeFromConfig())

	// Start goroutine to watch for file changes
	go a.watchLoop(watcher, path)

	return nil
}

// StopWatchingFile stops watching the current file
func (a *App) StopWatchingFile() {
	if a.watcher != nil {
		a.watcher.Close()
		a.watcher = nil
		a.watchedFile = ""
		a.watchedThemeFile = ""
		a.watchedThemeName = ""
	}
}

func (a *App) watchLoop(watcher *fsnotify.Watcher, target string) {
	target = filepath.Clean(target)
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			changed := filepath.Clean(event.Name)
			if changed == "" {
				continue
			}

			// Theme file changes
			if changed == a.watchedThemeFile && a.watchedThemeName != "" && (event.Op&(fsnotify.Write|fsnotify.Create) != 0) {
				runtime.EventsEmit(a.ctx, "theme-changed", a.watchedThemeName)
				continue
			}

			if changed != target {
				continue
			}

			switch {
			case event.Op&(fsnotify.Write|fsnotify.Create) != 0:
				runtime.EventsEmit(a.ctx, "file-changed", target)
			case event.Op&(fsnotify.Remove|fsnotify.Rename) != 0:
				go a.waitForReappear(target)
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			runtime.EventsEmit(a.ctx, "file-watch-error", err.Error())
		}
	}
}

func (a *App) waitForReappear(path string) {
	for i := 0; i < 10; i++ {
		time.Sleep(200 * time.Millisecond)
		if _, err := os.Stat(path); err == nil {
			runtime.EventsEmit(a.ctx, "file-changed", path)
			return
		}
	}
	runtime.EventsEmit(a.ctx, "file-watch-error", fmt.Sprintf("file missing: %s", path))
}

func (a *App) refreshThemeWatch(themeName string) {
	if a.watcher == nil {
		return
	}

	// Remove any previously watched theme file
	if a.watchedThemeFile != "" {
		_ = a.watcher.Remove(a.watchedThemeFile)
		a.watchedThemeFile = ""
		a.watchedThemeName = ""
	}

	themeName = strings.TrimSpace(themeName)
	if themeName == "" || themeName == "default" {
		return
	}

	dir, err := themesDir()
	if err != nil {
		return
	}

	name := filepath.Base(themeName)
	if !strings.HasSuffix(strings.ToLower(name), ".css") {
		name += ".css"
	}

	p := filepath.Clean(filepath.Join(dir, name))
	if err := a.watcher.Add(p); err != nil {
		return
	}

	a.watchedThemeFile = p
	a.watchedThemeName = strings.TrimSuffix(filepath.Base(name), filepath.Ext(name))
}

func enforceFileLimit(path string) error {
	limit := getMaxFileBytesFromConfig()
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if info.Size() > limit {
		return fmt.Errorf("file too large: %d bytes (limit %d)", info.Size(), limit)
	}
	return nil
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
