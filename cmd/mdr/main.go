package main

import (
	"flag"
	"os"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
)

func main() {
	// Parse command line arguments
	fileName := flag.String("file", "", "Markdown file to open")
	flag.Parse()

	// Create a new Fyne application
	myApp := app.New()
	window := myApp.NewWindow("Markdown Renderer")
	window.Resize(fyne.NewSize(800, 600))

	preview := widget.NewRichTextFromMarkdown("Open a markdown file using **File > Open** or drag a file onto the window.")
	preview.Wrapping = fyne.TextWrapWord

	// Create a scroll container for the content
	scroll := container.NewScroll(preview)
	window.SetContent(scroll)

	// Function to load and render markdown
	loadMarkdown := func(path string) {
		// Read the file
		data, err := os.ReadFile(path)
		if err != nil {
			preview.ParseMarkdown("Error reading file: " + err.Error())
			return
		}

		preview.ParseMarkdown(string(data))
	}

	// If a file was specified on the command line, open it
	if *fileName != "" {
		loadMarkdown(*fileName)
	}

	// Set up file opening
	window.SetOnDropped(func(pos fyne.Position, uris []fyne.URI) {
		if len(uris) > 0 {
			loadMarkdown(uris[0].Path())
		}
	})

	// Create a file open dialog
	openItem := fyne.NewMenuItem("Open", func() {
		fd := dialog.NewFileOpen(func(reader fyne.URIReadCloser, err error) {
			if reader != nil {
				defer reader.Close()
			}
			if err == nil && reader != nil {
				loadMarkdown(reader.URI().Path())
			}
		}, window)
		fd.Show()
	})

	// Create a menu
	fileMenu := fyne.NewMenu("File", openItem)
	mainMenu := fyne.NewMainMenu(fileMenu)
	window.SetMainMenu(mainMenu)

	// Show the window
	window.ShowAndRun()
}
