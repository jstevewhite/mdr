package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/jstevewhite/mdr/internal/config"
	"github.com/jstevewhite/mdr/internal/files"
	"github.com/jstevewhite/mdr/internal/theme"
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
	searchResult     SearchResult
	currentDocument  string
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
		p := files.NormalizePath(raw)
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
		np := files.NormalizePath(p)
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

func (a *App) emitStatus(level, code, message string) {
	// FIX: Read ctx with mutex protection
	a.mu.Lock()
	ctx := a.ctx
	a.mu.Unlock()

	if ctx == nil {
		return
	}

	level = strings.TrimSpace(level)
	if level == "" {
		level = "info"
	}
	runtime.EventsEmit(ctx, "status", StatusMessage{
		Level:   level,
		Code:    code,
		Message: message,
	})
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type RenderResult struct {
	Path      string    `json:"path"`
	HTML      string    `json:"html"`
	TOC       []TOCItem `json:"toc"`
	CharCount int       `json:"charCount"`
	WordCount int       `json:"wordCount"`
}

type StatusMessage struct {
	Level   string `json:"level"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// SearchResult represents a search match
type SearchResult struct {
	Query         string        `json:"query"`
	Matches       []SearchMatch `json:"matches"`
	Total         int           `json:"total"`
	CurrentIndex  int           `json:"currentIndex"`
	CaseSensitive bool          `json:"caseSensitive"`
}

// SearchMatch represents a single search match
type SearchMatch struct {
	ID       string `json:"id"`
	Text     string `json:"text"`
	Context  string `json:"context"`
	Position int    `json:"position"`
	Length   int    `json:"length"`
}

func (a *App) RenderMarkdown(markdown string, theme string) (string, error) {
	return RenderMarkdownToHTMLDocument(markdown, theme, config.GetPalette(), config.GetFontScale())
}

func (a *App) RenderMarkdownWithPalette(markdown string, theme string, palette string) (string, error) {
	return RenderMarkdownToHTMLDocument(markdown, theme, palette, config.GetFontScale())
}

func (a *App) GetTheme() string {
	return config.GetTheme()
}

func (a *App) SetTheme(theme string) error {
	if err := config.SetTheme(theme); err != nil {
		return err
	}
	// If auto-reload is active, refresh the watched theme file.
	a.refreshThemeWatch(theme)
	return nil
}

func (a *App) GetPalette() string {
	return config.GetPalette()
}

func (a *App) SetPalette(palette string) error {
	return config.SetPalette(palette)
}

func (a *App) GetFontScale() int {
	return config.GetFontScale()
}

func (a *App) SetFontScale(scale int) error {
	return config.SetFontScale(scale)
}

func (a *App) GetAutoReload() bool {
	return config.GetAutoReload()
}

func (a *App) SetAutoReload(enabled bool) error {
	return config.SetAutoReload(enabled)
}

func (a *App) GetTOCVisible() bool {
	return config.GetTOCVisible()
}

func (a *App) SetTOCVisible(visible bool) error {
	return config.SetTOCVisible(visible)
}

func (a *App) GetTOCPinned() bool {
	return config.GetTOCPinned()
}

func (a *App) SetTOCPinned(pinned bool) error {
	return config.SetTOCPinned(pinned)
}

func (a *App) GetSearchCaseSensitive() bool {
	return config.GetSearchCaseSensitive()
}

func (a *App) SetSearchCaseSensitive(enabled bool) error {
	return config.SetSearchCaseSensitive(enabled)
}

func (a *App) GetSearchHighlightColor() string {
	return config.GetSearchHighlightColor()
}

func (a *App) SetSearchHighlightColor(color string) error {
	return config.SetSearchHighlightColor(color)
}

func (a *App) ListThemes() ([]string, error) {
	items := []string{"default"}

	// 1. Get embedded themes
	embedded := theme.ListEmbeddedThemes()
	items = append(items, embedded...)

	// 2. Get local themes from directory
	dir, err := config.ThemesDir()
	if err == nil {
		entries, err := os.ReadDir(dir)
		if err == nil {
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
		}
	}

	// 3. Deduplicate and sort
	seen := map[string]struct{}{}
	uniq := make([]string, 0, len(items))
	for _, it := range items {
		if _, ok := seen[it]; ok || it == "default" {
			continue
		}
		seen[it] = struct{}{}
		uniq = append(uniq, it)
	}
	sort.Strings(uniq)

	return append([]string{"default"}, uniq...), nil
}

func (a *App) RenderFile(path string, theme string) (string, error) {
	return a.RenderFileWithPalette(path, theme, config.GetPalette())
}

func (a *App) RenderFileWithPalette(path string, theme string, palette string) (string, error) {
	path = files.NormalizePath(path)
	if err := files.EnforceFileLimit(path, config.GetMaxFileBytes()); err != nil {
		return "", err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return RenderMarkdownToHTMLDocument(string(data), theme, palette, config.GetFontScale())
}

// countWords counts the number of words in a string
func countWords(s string) int {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0
	}
	words := strings.Fields(s)
	return len(words)
}

// RenderFileWithPaletteAndTOC renders a file and returns HTML with TOC
func (a *App) RenderFileWithPaletteAndTOC(path string, theme string, palette string) (RenderResult, error) {
	path = files.NormalizePath(path)
	if err := files.EnforceFileLimit(path, config.GetMaxFileBytes()); err != nil {
		return RenderResult{}, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return RenderResult{}, err
	}

	markdown := string(data)

	// Store document content for searching
	a.SetCurrentDocument(markdown)

	output, err := RenderMarkdownWithTOC(markdown, theme, palette, config.GetFontScale())
	if err != nil {
		return RenderResult{}, err
	}

	return RenderResult{
		Path:      path,
		HTML:      output.HTML,
		TOC:       output.TOC,
		CharCount: len(markdown),
		WordCount: countWords(markdown),
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

// OpenInEditor opens the currently displayed file in mde
func (a *App) OpenInEditor() error {
	a.mu.Lock()
	path := a.watchedFile
	a.mu.Unlock()

	if path == "" {
		return fmt.Errorf("no file open")
	}

	cmd := exec.Command("open", "-a", "mde", path)
	err := cmd.Start()
	if err != nil {
		return fmt.Errorf("failed to launch mde: %w", err)
	}

	return nil
}

// StartWatchingFile starts watching the specified file for changes
func (a *App) StartWatchingFile(path string) error {
	// Stop watching any previously watched file
	a.StopWatchingFile()

	path = files.NormalizePath(path)
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

	// FIX: Write with mutex protection
	a.mu.Lock()
	a.watcher = watcher
	a.watchedFile = path
	a.mu.Unlock()

	// Also watch the current theme (if any)
	a.refreshThemeWatch(config.GetTheme())

	// Start goroutine to watch for file changes
	go a.watchLoop(watcher, path)

	return nil
}

// StopWatchingFile stops watching the current file
func (a *App) StopWatchingFile() {
	// FIX: Read and clear with mutex protection
	a.mu.Lock()
	watcher := a.watcher
	a.watcher = nil
	a.watchedFile = ""
	a.watchedThemeFile = ""
	a.watchedThemeName = ""
	a.mu.Unlock()

	// Close watcher outside the lock to avoid blocking
	if watcher != nil {
		watcher.Close()
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

			// FIX: Read theme file info with mutex protection
			a.mu.Lock()
			watchedTheme := a.watchedThemeFile
			themeName := a.watchedThemeName
			ctx := a.ctx
			a.mu.Unlock()

			// Theme file changes
			if changed == watchedTheme && themeName != "" && (event.Op&(fsnotify.Write|fsnotify.Create) != 0) {
				runtime.EventsEmit(ctx, "theme-changed", themeName)
				continue
			}

			if changed != target {
				continue
			}

			switch {
			case event.Op&(fsnotify.Write|fsnotify.Create) != 0:
				runtime.EventsEmit(ctx, "file-changed", target)
			case event.Op&(fsnotify.Remove|fsnotify.Rename) != 0:
				go a.waitForReappear(target)
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			a.emitStatus("error", "file-watch-error", err.Error())
		}
	}
}

func (a *App) waitForReappear(path string) {
	for i := 0; i < 10; i++ {
		time.Sleep(200 * time.Millisecond)
		if _, err := os.Stat(path); err == nil {
			// FIX: Read ctx with mutex protection
			a.mu.Lock()
			ctx := a.ctx
			a.mu.Unlock()
			runtime.EventsEmit(ctx, "file-changed", path)
			return
		}
	}
	a.emitStatus("error", "file-missing", fmt.Sprintf("file missing: %s", path))
}

func (a *App) refreshThemeWatch(themeName string) {
	// FIX: Check watcher existence with lock
	a.mu.Lock()
	watcher := a.watcher
	a.mu.Unlock()

	if watcher == nil {
		return
	}

	// Remove any previously watched theme file
	a.mu.Lock()
	oldThemeFile := a.watchedThemeFile
	a.mu.Unlock()

	if oldThemeFile != "" {
		_ = watcher.Remove(oldThemeFile)

		// FIX: Clear with mutex protection
		a.mu.Lock()
		a.watchedThemeFile = ""
		a.watchedThemeName = ""
		a.mu.Unlock()
	}

	themeName = strings.TrimSpace(themeName)
	if themeName == "" || themeName == "default" {
		return
	}

	dir, err := config.ThemesDir()
	if err != nil {
		return
	}

	name := filepath.Base(themeName)
	if !strings.HasSuffix(strings.ToLower(name), ".css") {
		name += ".css"
	}

	p := filepath.Clean(filepath.Join(dir, name))
	if err := watcher.Add(p); err != nil {
		return
	}

	// FIX: Write with mutex protection
	a.mu.Lock()
	a.watchedThemeFile = p
	a.watchedThemeName = strings.TrimSuffix(filepath.Base(name), filepath.Ext(name))
	a.mu.Unlock()
}

// SearchDocument searches for text in the current document
func (a *App) SearchDocument(query string, caseSensitive bool) (SearchResult, error) {
	a.mu.Lock()
	document := a.currentDocument
	a.mu.Unlock()

	if document == "" {
		return SearchResult{}, fmt.Errorf("no document loaded")
	}

	query = strings.TrimSpace(query)
	if query == "" {
		a.mu.Lock()
		a.searchResult = SearchResult{}
		a.mu.Unlock()
		return SearchResult{}, nil
	}

	// Perform search
	searchText := document
	searchQuery := query
	if !caseSensitive {
		searchText = strings.ToLower(searchText)
		searchQuery = strings.ToLower(searchQuery)
	}

	var matches []SearchMatch
	currentPos := 0
	matchID := 0

	for {
		pos := strings.Index(searchText[currentPos:], searchQuery)
		if pos == -1 {
			break
		}

		actualPos := currentPos + pos
		contextStart := actualPos - 50
		if contextStart < 0 {
			contextStart = 0
		}
		contextEnd := actualPos + len(query) + 50
		if contextEnd > len(document) {
			contextEnd = len(document)
		}

		context := document[contextStart:contextEnd]
		matchText := document[actualPos : actualPos+len(query)]

		matches = append(matches, SearchMatch{
			ID:       fmt.Sprintf("search-match-%d", matchID),
			Text:     matchText,
			Context:  context,
			Position: actualPos,
			Length:   len(query),
		})

		matchID++
		currentPos = actualPos + 1

		// Limit results to prevent performance issues
		if len(matches) >= 1000 {
			break
		}
	}

	result := SearchResult{
		Query:         query,
		Matches:       matches,
		Total:         len(matches),
		CurrentIndex:  0,
		CaseSensitive: caseSensitive,
	}

	a.mu.Lock()
	a.searchResult = result
	a.mu.Unlock()

	return result, nil
}

// GetSearchState returns the current search state
func (a *App) GetSearchState() SearchResult {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.searchResult
}

// ClearSearch clears the current search
func (a *App) ClearSearch() {
	a.mu.Lock()
	a.searchResult = SearchResult{}
	a.mu.Unlock()
}

// NavigateSearch moves to the next or previous match
func (a *App) NavigateSearch(direction string) (SearchResult, error) {
	a.mu.Lock()
	result := a.searchResult
	a.mu.Unlock()

	if result.Total == 0 {
		return result, nil
	}

	if direction == "next" {
		result.CurrentIndex++
		if result.CurrentIndex >= result.Total {
			result.CurrentIndex = 0 // Wrap around
		}
	} else if direction == "prev" {
		result.CurrentIndex--
		if result.CurrentIndex < 0 {
			result.CurrentIndex = result.Total - 1 // Wrap around
		}
	}

	a.mu.Lock()
	a.searchResult = result
	a.mu.Unlock()

	return result, nil
}

// SetCurrentDocument stores the current document content for searching
func (a *App) SetCurrentDocument(content string) {
	a.mu.Lock()
	a.currentDocument = content
	a.mu.Unlock()
}
