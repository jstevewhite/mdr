package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync"

	"github.com/jstevewhite/mdr/internal/config"
	"github.com/jstevewhite/mdr/internal/files"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	mu               sync.Mutex
	ctx              context.Context
	currentPath      string
	isDirty          bool
	launchArgs       []string
	pendingFileOpens []string
	initialFile      string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
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

func (a *App) setInitialFile(path string) {
	a.mu.Lock()
	a.initialFile = path
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

// GetLaunchArgs returns the launch arguments
func (a *App) GetLaunchArgs() []string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return append([]string(nil), a.launchArgs...)
}

// OpenFile opens a file dialog and returns the file path and content
func (a *App) OpenFile() (string, error) {
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
		return "", err
	}
	if selection == "" {
		return "", nil
	}

	content, err := files.ReadFile(selection)
	if err != nil {
		return "", err
	}

	a.mu.Lock()
	a.currentPath = selection
	a.isDirty = false
	a.mu.Unlock()

	return content, nil
}

// SaveFile saves the content to the current file
func (a *App) SaveFile(content string) error {
	a.mu.Lock()
	path := a.currentPath
	a.mu.Unlock()

	if path == "" {
		return fmt.Errorf("no file open")
	}

	err := files.WriteFile(path, content)
	if err != nil {
		return err
	}

	a.mu.Lock()
	a.isDirty = false
	a.mu.Unlock()

	return nil
}

// SaveFileAs saves the content to a new file
func (a *App) SaveFileAs(content string) error {
	selection, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title: "Save Markdown",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Markdown (*.md;*.markdown)",
				Pattern:     "*.md;*.markdown",
			},
		},
	})
	if err != nil {
		return err
	}
	if selection == "" {
		return nil
	}

	err = files.WriteFile(selection, content)
	if err != nil {
		return err
	}

	a.mu.Lock()
	a.currentPath = selection
	a.isDirty = false
	a.mu.Unlock()

	return nil
}

// GetCurrentPath returns the current file path
func (a *App) GetCurrentPath() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.currentPath
}

// SetDirty sets the dirty flag
func (a *App) SetDirty(dirty bool) {
	a.mu.Lock()
	a.isDirty = dirty
	a.mu.Unlock()
}

// IsDirty returns whether the file has unsaved changes
func (a *App) IsDirty() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.isDirty
}

// OpenInPreview opens the current file in mdr
func (a *App) OpenInPreview() error {
	a.mu.Lock()
	path := a.currentPath
	a.mu.Unlock()

	if path == "" {
		return fmt.Errorf("no file open")
	}

	cmd := exec.Command("mdr", path)
	err := cmd.Start()
	if err != nil {
		return fmt.Errorf("failed to launch mdr: %w", err)
	}

	return nil
}

// GetTheme returns the current theme
func (a *App) GetTheme() string {
	return config.GetTheme()
}

// SetTheme sets the theme
func (a *App) SetTheme(theme string) error {
	return config.SetTheme(theme)
}

// GetPalette returns the current palette
func (a *App) GetPalette() string {
	return config.GetPalette()
}

// SetPalette sets the palette
func (a *App) SetPalette(palette string) error {
	return config.SetPalette(palette)
}

// GetFontScale returns the current font scale
func (a *App) GetFontScale() int {
	return config.GetFontScale()
}

// SetFontScale sets the font scale
func (a *App) SetFontScale(scale int) error {
	return config.SetFontScale(scale)
}

// ListThemes returns available themes
func (a *App) ListThemes() ([]string, error) {
	items := []string{"default"}

	dir, err := config.ThemesDir()
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
		name = strings.TrimSuffix(name, ".css")
		if name == "" {
			continue
		}
		items = append(items, name)
	}
	return items, nil
}
