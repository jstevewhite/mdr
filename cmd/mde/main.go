package main

import (
	"embed"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist/*
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Get initial file from command line args if provided
	var initialFile string
	if len(os.Args) > 1 {
		initialFile = os.Args[1]
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "mde",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarDefault(),
			About: &mac.AboutInfo{
				Title:   "mde",
				Message: "A cross-platform Markdown editor",
			},
			OnFileOpen: func(filePath string) {
				app.handleFileOpen([]string{filePath})
			},
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}

	// Pass initial file if provided
	if initialFile != "" {
		app.setInitialFile(initialFile)
	}
}
