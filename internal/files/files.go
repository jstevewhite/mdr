package files

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// NormalizePath normalizes a file path (handles ~, file://, relative paths)
func NormalizePath(p string) string {
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

// ReadFile reads a file and returns its contents as a string
func ReadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// WriteFile writes content to a file
func WriteFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

// EnforceFileLimit checks if a file is within the allowed size limit
func EnforceFileLimit(path string, maxBytes int64) error {
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if info.Size() > maxBytes {
		return fmt.Errorf("file too large: %d bytes (limit %d)", info.Size(), maxBytes)
	}
	return nil
}
