package mdeconfig

import (
	"bufio"
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Palette mode constants
const (
	ThemeLight = "light"
	ThemeDark  = "dark"
)

// ConfigPath returns the path to mde's config file.
func ConfigPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config", "mde", "mde.conf"), nil
}

// ReadConfig reads the configuration file.
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

// WriteConfig writes the configuration file.
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

// GetTheme returns the current syntax theme from mde's config.
func GetTheme() string {
	cfg, err := ReadConfig()
	if err != nil {
		return "default"
	}
	v := strings.TrimSpace(cfg["theme"])
	if v == "" {
		return "default"
	}
	return v
}

// SetTheme sets the syntax theme in mde's config.
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

// GetPalette returns the current palette from mde's config.
func GetPalette() string {
	cfg, err := ReadConfig()
	if err != nil {
		return ThemeDark
	}

	v := strings.TrimSpace(cfg["palette"])
	switch v {
	case ThemeLight, ThemeDark, "theme":
		return v
	case "":
		return ThemeDark
	default:
		return ThemeDark
	}
}

// SetPalette sets the palette in mde's config.
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
		p = ThemeDark
	default:
		p = ThemeDark
	}

	cfg["palette"] = p
	return WriteConfig(cfg)
}

// GetFontScale returns the current font scale from mde's config.
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

// SetFontScale sets the font scale in mde's config.
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
