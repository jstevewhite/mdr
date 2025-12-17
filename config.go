package main

import (
	"bufio"
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func configPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config", "mdr", "mdr.conf"), nil
}

func themesDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config", "mdr", "mdthemes"), nil
}

func readConfig() (map[string]string, error) {
	path, err := configPath()
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

func writeConfig(cfg map[string]string) error {
	path, err := configPath()
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

func getThemeFromConfig() string {
	cfg, err := readConfig()
	if err != nil {
		return "default"
	}
	v := strings.TrimSpace(cfg["theme"])
	if v == "" {
		return "default"
	}
	if v == string(themeLight) || v == string(themeDark) {
		return "default"
	}
	return v
}

func setThemeInConfig(theme string) error {
	cfg, err := readConfig()
	if err != nil {
		return err
	}
	theme = strings.TrimSpace(theme)
	if theme == "" {
		theme = "default"
	}
	cfg["theme"] = theme
	return writeConfig(cfg)
}

func getPaletteFromConfig() string {
	cfg, err := readConfig()
	if err != nil {
		return string(themeLight)
	}

	v := strings.TrimSpace(cfg["palette"])
	if v != "" {
		switch v {
		case string(themeLight), string(themeDark), "theme":
			return v
		default:
			return string(themeLight)
		}
	}

	legacy := strings.TrimSpace(cfg["theme"])
	if legacy == string(themeLight) || legacy == string(themeDark) {
		return legacy
	}

	return string(themeLight)
}

func setPaletteInConfig(palette string) error {
	cfg, err := readConfig()
	if err != nil {
		return err
	}

	p := strings.TrimSpace(palette)
	switch p {
	case string(themeLight), string(themeDark), "theme":
		// ok
	case "":
		p = string(themeLight)
	default:
		p = string(themeLight)
	}

	cfg["palette"] = p
	return writeConfig(cfg)
}

func getFontScaleFromConfig() int {
	cfg, err := readConfig()
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

func setFontScaleInConfig(scale int) error {
	cfg, err := readConfig()
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
	return writeConfig(cfg)
}

func getAutoReloadFromConfig() bool {
	cfg, err := readConfig()
	if err != nil {
		return false
	}

	v := strings.TrimSpace(cfg["autoReload"])
	return v == "true" || v == "1" || v == "yes"
}

func setAutoReloadInConfig(enabled bool) error {
	cfg, err := readConfig()
	if err != nil {
		return err
	}

	if enabled {
		cfg["autoReload"] = "true"
	} else {
		cfg["autoReload"] = "false"
	}

	return writeConfig(cfg)
}

func getTOCVisibleFromConfig() bool {
	cfg, err := readConfig()
	if err != nil {
		return false
	}

	v := strings.TrimSpace(cfg["tocVisible"])
	return v == "true" || v == "1" || v == "yes"
}

func setTOCVisibleInConfig(visible bool) error {
	cfg, err := readConfig()
	if err != nil {
		return err
	}

	if visible {
		cfg["tocVisible"] = "true"
	} else {
		cfg["tocVisible"] = "false"
	}

	return writeConfig(cfg)
}

func getTOCPinnedFromConfig() bool {
	cfg, err := readConfig()
	if err != nil {
		return false
	}

	v := strings.TrimSpace(cfg["tocPinned"])
	return v == "true" || v == "1" || v == "yes"
}

func setTOCPinnedInConfig(pinned bool) error {
	cfg, err := readConfig()
	if err != nil {
		return err
	}

	if pinned {
		cfg["tocPinned"] = "true"
	} else {
		cfg["tocPinned"] = "false"
	}

	return writeConfig(cfg)
}
