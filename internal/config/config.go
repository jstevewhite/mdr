package config

import (
	"bufio"
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Theme mode constants
const (
	ThemeLight = "light"
	ThemeDark  = "dark"
)

// ConfigPath returns the path to the config file
func ConfigPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config", "mdr", "mdr.conf"), nil
}

// ThemesDir returns the path to the themes directory
func ThemesDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config", "mdr", "mdthemes"), nil
}

// ReadConfig reads the configuration file
func ReadConfig() (map[string]string, error) {
	path, err := ConfigPath()
	if err != nil {
		return nil, err
	}
	f, err := os.Open(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return map[string]string{}, nil
		}
		return nil, err
	}
	defer f.Close()

	cfg := map[string]string{}
	s := bufio.NewScanner(f)
	for s.Scan() {
		line := strings.TrimSpace(s.Text())
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, ";") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		k = strings.TrimSpace(k)
		v = strings.TrimSpace(v)
		if k == "" {
			continue
		}
		cfg[k] = v
	}
	if err := s.Err(); err != nil {
		return nil, err
	}
	return cfg, nil
}

// WriteConfig writes the configuration file
func WriteConfig(cfg map[string]string) error {
	path, err := ConfigPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}

	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	w := bufio.NewWriter(f)
	for k, v := range cfg {
		if _, err := w.WriteString(k + "=" + v + "\n"); err != nil {
			return err
		}
	}
	return w.Flush()
}

// GetTheme returns the current theme from config
func GetTheme() string {
	cfg, err := ReadConfig()
	if err != nil {
		return "default"
	}
	v := strings.TrimSpace(cfg["theme"])
	if v == "" {
		return "default"
	}
	if v == ThemeLight || v == ThemeDark {
		return "default"
	}
	return v
}

// SetTheme sets the theme in config
func SetTheme(theme string) error {
	cfg, err := ReadConfig()
	if err != nil {
		return err
	}
	theme = strings.TrimSpace(theme)
	if theme == "" {
		theme = "default"
	}
	cfg["theme"] = theme
	return WriteConfig(cfg)
}

// GetPalette returns the current palette from config
func GetPalette() string {
	cfg, err := ReadConfig()
	if err != nil {
		return ThemeLight
	}

	v := strings.TrimSpace(cfg["palette"])
	if v != "" {
		switch v {
		case ThemeLight, ThemeDark, "theme":
			return v
		default:
			return ThemeLight
		}
	}

	// Legacy theme config
	legacy := strings.TrimSpace(cfg["theme"])
	if legacy == ThemeLight || legacy == ThemeDark {
		return legacy
	}

	return ThemeLight
}

// SetPalette sets the palette in config
func SetPalette(palette string) error {
	cfg, err := ReadConfig()
	if err != nil {
		return err
	}

	p := strings.TrimSpace(palette)
	switch p {
	case ThemeLight, ThemeDark, "theme":
		// ok
	case "":
		p = ThemeLight
	default:
		p = ThemeLight
	}

	cfg["palette"] = p
	return WriteConfig(cfg)
}

// GetFontScale returns the current font scale from config
func GetFontScale() int {
	cfg, err := ReadConfig()
	if err != nil {
		return 100
	}

	v := strings.TrimSpace(cfg["fontScale"])
	if v == "" {
		return 100
	}

	n, err := strconv.Atoi(v)
	if err != nil {
		return 100
	}
	if n < 50 {
		return 50
	}
	if n > 200 {
		return 200
	}
	return n
}

// SetFontScale sets the font scale in config
func SetFontScale(scale int) error {
	cfg, err := ReadConfig()
	if err != nil {
		return err
	}

	if scale < 50 {
		scale = 50
	}
	if scale > 200 {
		scale = 200
	}

	cfg["fontScale"] = strconv.Itoa(scale)
	return WriteConfig(cfg)
}

// GetAutoReload returns whether auto-reload is enabled
func GetAutoReload() bool {
	cfg, err := ReadConfig()
	if err != nil {
		return false
	}

	v := strings.TrimSpace(cfg["autoReload"])
	return v == "true" || v == "1" || v == "yes"
}

// SetAutoReload sets whether auto-reload is enabled
func SetAutoReload(enabled bool) error {
	cfg, err := ReadConfig()
	if err != nil {
		return err
	}

	if enabled {
		cfg["autoReload"] = "true"
	} else {
		cfg["autoReload"] = "false"
	}

	return WriteConfig(cfg)
}

// GetTOCVisible returns whether TOC is visible
func GetTOCVisible() bool {
	cfg, err := ReadConfig()
	if err != nil {
		return false
	}

	v := strings.TrimSpace(cfg["tocVisible"])
	return v == "true" || v == "1" || v == "yes"
}

// SetTOCVisible sets whether TOC is visible
func SetTOCVisible(visible bool) error {
	cfg, err := ReadConfig()
	if err != nil {
		return err
	}

	if visible {
		cfg["tocVisible"] = "true"
	} else {
		cfg["tocVisible"] = "false"
	}

	return WriteConfig(cfg)
}

// GetTOCPinned returns whether TOC is pinned
func GetTOCPinned() bool {
	cfg, err := ReadConfig()
	if err != nil {
		return false
	}

	v := strings.TrimSpace(cfg["tocPinned"])
	return v == "true" || v == "1" || v == "yes"
}

// SetTOCPinned sets whether TOC is pinned
func SetTOCPinned(pinned bool) error {
	cfg, err := ReadConfig()
	if err != nil {
		return err
	}

	if pinned {
		cfg["tocPinned"] = "true"
	} else {
		cfg["tocPinned"] = "false"
	}

	return WriteConfig(cfg)
}

// GetMaxFileBytes returns the maximum file size in bytes
func GetMaxFileBytes() int64 {
	cfg, err := ReadConfig()
	if err != nil {
		return 5 * 1024 * 1024
	}

	v := strings.TrimSpace(cfg["maxFileSizeMB"])
	if v == "" {
		return 5 * 1024 * 1024
	}
	n, err := strconv.Atoi(v)
	if err != nil || n < 1 {
		return 5 * 1024 * 1024
	}
	// Cap to 100 MB to avoid accidental huge loads.
	if n > 100 {
		n = 100
	}
	return int64(n) * 1024 * 1024
}

// GetSearchCaseSensitive returns whether search is case-sensitive
func GetSearchCaseSensitive() bool {
	cfg, err := ReadConfig()
	if err != nil {
		return false
	}

	v := strings.TrimSpace(cfg["searchCaseSensitive"])
	return v == "true" || v == "1" || v == "yes"
}

// SetSearchCaseSensitive sets whether search is case-sensitive
func SetSearchCaseSensitive(enabled bool) error {
	cfg, err := ReadConfig()
	if err != nil {
		return err
	}

	if enabled {
		cfg["searchCaseSensitive"] = "true"
	} else {
		cfg["searchCaseSensitive"] = "false"
	}

	return WriteConfig(cfg)
}

// GetSearchHighlightColor returns the search highlight color
func GetSearchHighlightColor() string {
	cfg, err := ReadConfig()
	if err != nil {
		return "yellow"
	}

	v := strings.TrimSpace(cfg["searchHighlightColor"])
	if v == "" {
		return "yellow"
	}
	// Validate color options
	validColors := []string{"yellow", "green", "blue", "orange", "purple"}
	for _, color := range validColors {
		if v == color {
			return v
		}
	}
	return "yellow"
}

// SetSearchHighlightColor sets the search highlight color
func SetSearchHighlightColor(color string) error {
	cfg, err := ReadConfig()
	if err != nil {
		return err
	}

	color = strings.TrimSpace(color)
	if color == "" {
		color = "yellow"
	}
	// Validate color options
	validColors := []string{"yellow", "green", "blue", "orange", "purple"}
	isValid := false
	for _, validColor := range validColors {
		if color == validColor {
			isValid = true
			break
		}
	}
	if !isValid {
		color = "yellow"
	}

	cfg["searchHighlightColor"] = color
	return WriteConfig(cfg)
}
