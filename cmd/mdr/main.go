package main

import (
	"embed"
	"net/http"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

// LocalFileAssetHandler implements http.Handler to serve local files
type LocalFileAssetHandler struct {
	embedded http.Handler
}

func (h *LocalFileAssetHandler) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	// Check if this is a request for a local file
	if strings.HasPrefix(req.URL.Path, "/localfile/") {
		h.serveLocalFile(rw, req)
		return
	}

	// Otherwise, serve embedded assets
	h.embedded.ServeHTTP(rw, req)
}

func (h *LocalFileAssetHandler) serveLocalFile(rw http.ResponseWriter, req *http.Request) {
	// Extract the path from the URL
	// Expected format: /localfile/<base64-encoded-path>
	resolver := &ImagePathResolver{}

	filePath, err := resolver.ResolveImagePath(req.URL.Path)
	if err != nil {
		http.Error(rw, "Invalid path", http.StatusBadRequest)
		return
	}

	// Check if file exists and is readable
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(rw, "File not found", http.StatusNotFound)
		} else {
			http.Error(rw, "File access error", http.StatusForbidden)
		}
		return
	}

	// Don't serve directories
	if fileInfo.IsDir() {
		http.Error(rw, "Cannot serve directory", http.StatusForbidden)
		return
	}

	// Open and serve the file
	file, err := os.Open(filePath)
	if err != nil {
		http.Error(rw, "Cannot open file", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	// Detect content type from file extension and serve
	http.ServeContent(rw, req, filePath, fileInfo.ModTime(), file)
}

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "mdr",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
			Handler: &LocalFileAssetHandler{
				embedded: http.FileServer(http.FS(assets)),
			},
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarDefault(),
			About: &mac.AboutInfo{
				Title:   "mdr",
				Message: "A cross-platform Markdown viewer",
			},
			OnFileOpen: func(filePath string) {
				app.handleFileOpen([]string{filePath})
			},
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
