package theme

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/jstevewhite/mdr/internal/config"
)

// LoadThemeCSS loads the CSS content for a theme by name
func LoadThemeCSS(themeName string) string {
	themeName = strings.TrimSpace(themeName)
	if themeName == "" || themeName == "default" {
		return ""
	}

	dir, err := config.ThemesDir()
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
