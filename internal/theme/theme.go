package theme

import (
	"embed"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jstevewhite/mdr/internal/config"
)

//go:embed embedded/*.css
var embeddedThemes embed.FS

// LoadThemeCSS loads the CSS content for a theme by name
func LoadThemeCSS(themeName string) string {
	themeName = strings.TrimSpace(themeName)
	if themeName == "" || themeName == "default" {
		return ""
	}

	// 1. Try local file first
	dir, err := config.ThemesDir()
	if err == nil {
		name := filepath.Base(themeName)
		if !strings.HasSuffix(strings.ToLower(name), ".css") {
			name += ".css"
		}
		path := filepath.Join(dir, name)

		if b, err := os.ReadFile(path); err == nil {
			return string(b)
		}
	}

	// 2. Fall back to embedded themes
	name := themeName
	if !strings.HasSuffix(strings.ToLower(name), ".css") {
		name += ".css"
	}
	f, err := embeddedThemes.Open("embedded/" + name)
	if err != nil {
		return ""
	}
	defer f.Close()

	b, err := io.ReadAll(f)
	if err != nil {
		return ""
	}
	return string(b)
}

// ListEmbeddedThemes returns the names of the embedded themes
func ListEmbeddedThemes() []string {
	entries, err := embeddedThemes.ReadDir("embedded")
	if err != nil {
		return nil
	}

	var themes []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if strings.HasSuffix(strings.ToLower(name), ".css") {
			themes = append(themes, strings.TrimSuffix(name, filepath.Ext(name)))
		}
	}
	sort.Strings(themes)
	return themes
}
