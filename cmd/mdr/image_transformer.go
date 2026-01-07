package main

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/text"
)

// ImageTransformer rewrites image paths to use the local file server
type ImageTransformer struct {
	markdownFilePath string
}

// NewImageTransformer creates a new image transformer
func NewImageTransformer(markdownFilePath string) parser.ASTTransformer {
	return &ImageTransformer{
		markdownFilePath: markdownFilePath,
	}
}

// Transform walks the AST and rewrites image paths
func (t *ImageTransformer) Transform(node *ast.Document, reader text.Reader, pc parser.Context) {
	_ = ast.Walk(node, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}

		if img, ok := n.(*ast.Image); ok {
			destination := string(img.Destination)
			if newDest := t.transformImagePath(destination); newDest != "" {
				img.Destination = []byte(newDest)
			}
		}

		return ast.WalkContinue, nil
	})
}

// transformImagePath converts various image path formats to a usable URL
func (t *ImageTransformer) transformImagePath(imagePath string) string {
	imagePath = strings.TrimSpace(imagePath)
	if imagePath == "" {
		return ""
	}

	// Already a data URI - leave it as is
	if strings.HasPrefix(imagePath, "data:") {
		return ""
	}

	// Already an HTTP/HTTPS URL - leave it as is
	if strings.HasPrefix(imagePath, "http://") || strings.HasPrefix(imagePath, "https://") {
		return ""
	}

	// Handle file:// URLs
	if strings.HasPrefix(imagePath, "file://") {
		// Remove file:// prefix
		imagePath = strings.TrimPrefix(imagePath, "file://")
		// On Windows, we might have file:///C:/path, so handle the extra slash
		if len(imagePath) > 0 && imagePath[0] == '/' {
			// Check if this looks like a Windows path (e.g., /C:/...)
			if len(imagePath) > 2 && imagePath[2] == ':' {
				imagePath = imagePath[1:]
			}
		}
	}

	// Resolve relative paths and ~
	resolvedPath := t.resolvePath(imagePath)
	if resolvedPath == "" {
		return ""
	}

	// Check if file exists
	if _, err := os.Stat(resolvedPath); err != nil {
		// File doesn't exist, leave the path as-is
		return ""
	}

	// Encode the absolute path for use in a URL
	// We'll use /localfile/<base64-encoded-path>
	encoded := base64.URLEncoding.EncodeToString([]byte(resolvedPath))
	return fmt.Sprintf("/localfile/%s", encoded)
}

// resolvePath resolves relative paths, ~ paths, and makes paths absolute
func (t *ImageTransformer) resolvePath(imagePath string) string {
	// Handle ~ expansion
	if strings.HasPrefix(imagePath, "~/") {
		home, err := os.UserHomeDir()
		if err != nil {
			return ""
		}
		imagePath = filepath.Join(home, imagePath[2:])
	} else if imagePath == "~" {
		home, err := os.UserHomeDir()
		if err != nil {
			return ""
		}
		imagePath = home
	}

	// If already absolute, clean and return
	if filepath.IsAbs(imagePath) {
		return filepath.Clean(imagePath)
	}

	// Relative path - resolve relative to the markdown file's directory
	if t.markdownFilePath != "" {
		markdownDir := filepath.Dir(t.markdownFilePath)
		imagePath = filepath.Join(markdownDir, imagePath)
	} else {
		// No markdown file context, try to make it absolute from current directory
		absPath, err := filepath.Abs(imagePath)
		if err != nil {
			return ""
		}
		imagePath = absPath
	}

	return filepath.Clean(imagePath)
}

// ImagePathResolver resolves image URLs back to file paths
type ImagePathResolver struct{}

// ResolveImagePath decodes a /localfile/ URL back to a file path
func (r *ImagePathResolver) ResolveImagePath(urlStr string) (string, error) {
	// Expected format: /localfile/<base64-encoded-path>
	if !strings.HasPrefix(urlStr, "/localfile/") {
		return "", fmt.Errorf("not a local file URL: %s", urlStr)
	}

	// Decode the path
	encodedPath := strings.TrimPrefix(urlStr, "/localfile/")
	decodedBytes, err := base64.URLEncoding.DecodeString(encodedPath)
	if err != nil {
		return "", fmt.Errorf("failed to decode path: %w", err)
	}

	return string(decodedBytes), nil
}
