package main

import (
	"flag"
	"fmt"
	"image/color"
	"os"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"
)

const (
	prefThemeVariant = "mdr.theme.variant" // system|light|dark
	prefTextScale    = "mdr.theme.textScale"
	prefPaddingScale = "mdr.theme.paddingScale"
	prefMaxWidth     = "mdr.layout.maxWidth" // px
	prefReaderPreset = "mdr.reader.preset"   // compact|github|newspaper|custom
)

type appTheme struct {
	base         fyne.Theme
	variant      fyne.ThemeVariant
	forceVariant bool
	textScale    float32
	padScale     float32
}

func (t *appTheme) Color(name fyne.ThemeColorName, v fyne.ThemeVariant) color.Color {
	if t.forceVariant {
		v = t.variant
	}
	return t.base.Color(name, v)
}

func (t *appTheme) Font(style fyne.TextStyle) fyne.Resource {
	return t.base.Font(style)
}

func (t *appTheme) Icon(name fyne.ThemeIconName) fyne.Resource {
	return t.base.Icon(name)
}

func (t *appTheme) Size(name fyne.ThemeSizeName) float32 {
	s := t.base.Size(name)
	switch name {
	case theme.SizeNameText:
		return s * t.textScale
	case theme.SizeNamePadding, theme.SizeNameInnerPadding:
		return s * t.padScale
	default:
		return s
	}
}

type maxWidthLayout struct {
	maxWidth float32
}

func (l *maxWidthLayout) Layout(objects []fyne.CanvasObject, size fyne.Size) {
	if len(objects) == 0 {
		return
	}

	child := objects[0]
	width := size.Width
	if l.maxWidth > 0 && width > l.maxWidth {
		width = l.maxWidth
	}

	x := float32(0)
	if size.Width > width {
		x = (size.Width - width) / 2
	}
	child.Move(fyne.NewPos(x, 0))
	child.Resize(fyne.NewSize(width, size.Height))
}

func (l *maxWidthLayout) MinSize(objects []fyne.CanvasObject) fyne.Size {
	if len(objects) == 0 {
		return fyne.NewSize(0, 0)
	}

	ms := objects[0].MinSize()
	if l.maxWidth > 0 && ms.Width > l.maxWidth {
		ms.Width = l.maxWidth
	}
	return ms
}

func main() {
	// Parse command line arguments
	fileName := flag.String("file", "", "Markdown file to open (fallback if no positional args)")
	flag.Parse()
	posArgs := flag.Args()

	// Create a new Fyne application
	myApp := app.NewWithID("com.jstevewhite.mdr")
	prefs := myApp.Preferences()

	variantPref := prefs.StringWithFallback(prefThemeVariant, "system")
	textScale := float32(prefs.FloatWithFallback(prefTextScale, 1.0))
	padScale := float32(prefs.FloatWithFallback(prefPaddingScale, 1.0))
	maxWidth := float32(prefs.IntWithFallback(prefMaxWidth, 900))
	readerPreset := prefs.StringWithFallback(prefReaderPreset, "github")

	applyPreset := func(name string) {
		// Presets are meant to feel different (spacing/line length) but remain simple.
		switch name {
		case "custom":
			return
		case "compact":
			textScale = 0.95
			padScale = 0.85
			maxWidth = 1100
		case "newspaper":
			textScale = 1.15
			padScale = 1.25
			maxWidth = 760
		case "github":
			fallthrough
		default:
			textScale = 1.0
			padScale = 1.0
			maxWidth = 900
			name = "github"
		}
		readerPreset = name
		prefs.SetString(prefReaderPreset, readerPreset)
		prefs.SetFloat(prefTextScale, float64(textScale))
		prefs.SetFloat(prefPaddingScale, float64(padScale))
		prefs.SetInt(prefMaxWidth, int(maxWidth))
	}

	markCustom := func() {
		if readerPreset != "custom" {
			readerPreset = "custom"
			prefs.SetString(prefReaderPreset, readerPreset)
		}
	}

	if readerPreset != "" {
		applyPreset(readerPreset)
	}

	applyTheme := func() {
		base := theme.DefaultTheme()
		at := &appTheme{
			base:      base,
			textScale: textScale,
			padScale:  padScale,
		}

		switch variantPref {
		case "light":
			at.forceVariant = true
			at.variant = theme.VariantLight
		case "dark":
			at.forceVariant = true
			at.variant = theme.VariantDark
		default:
			variantPref = "system"
			at.forceVariant = false
		}

		myApp.Settings().SetTheme(at)
		prefs.SetString(prefThemeVariant, variantPref)
	}

	applyTheme()

	window := myApp.NewWindow("mdr")
	window.Resize(fyne.NewSize(800, 600))

	preview := widget.NewRichTextFromMarkdown("Open a markdown file using **File > Open** or drag a file onto the window.")
	preview.Wrapping = fyne.TextWrapWord

	mwLayout := &maxWidthLayout{maxWidth: maxWidth}
	maxWidthWrap := container.New(mwLayout, container.NewPadded(preview))

	// Create a scroll container for the content
	scroll := container.NewScroll(maxWidthWrap)
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

	// If a file was specified on the command line, open it.
	// Supports: `mdr README.md` or `mdr *.md` (shell expands glob, we take the first).
	if len(posArgs) > 0 {
		loadMarkdown(posArgs[0])
	} else if *fileName != "" {
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

	var mainMenu *fyne.MainMenu
	var (
		colorThemeSystem *fyne.MenuItem
		colorThemeLight  *fyne.MenuItem
		colorThemeDark   *fyne.MenuItem

		readerCompact   *fyne.MenuItem
		readerGitHub    *fyne.MenuItem
		readerNewspaper *fyne.MenuItem
	)

	updateMenuChecks := func() {
		if colorThemeSystem != nil {
			colorThemeSystem.Checked = variantPref == "system"
		}
		if colorThemeLight != nil {
			colorThemeLight.Checked = variantPref == "light"
		}
		if colorThemeDark != nil {
			colorThemeDark.Checked = variantPref == "dark"
		}

		if readerCompact != nil {
			readerCompact.Checked = readerPreset == "compact"
		}
		if readerGitHub != nil {
			readerGitHub.Checked = readerPreset == "github"
		}
		if readerNewspaper != nil {
			readerNewspaper.Checked = readerPreset == "newspaper"
		}
	}

	applyLayout := func() {
		mwLayout.maxWidth = maxWidth
		maxWidthWrap.Refresh()
	}

	clamp := func(v, min, max float32) float32 {
		if v < min {
			return min
		}
		if v > max {
			return max
		}
		return v
	}

	applyAndPersist := func() {
		prefs.SetFloat(prefTextScale, float64(textScale))
		prefs.SetFloat(prefPaddingScale, float64(padScale))
		prefs.SetInt(prefMaxWidth, int(maxWidth))
		applyTheme()
		applyLayout()
		window.Content().Refresh()
	}

	// View menu: color theme + reader presets
	colorThemeSystem = fyne.NewMenuItem("System", func() {
		variantPref = "system"
		applyTheme()
		updateMenuChecks()
		window.Content().Refresh()
	})
	colorThemeLight = fyne.NewMenuItem("Light", func() {
		variantPref = "light"
		applyTheme()
		updateMenuChecks()
		window.Content().Refresh()
	})
	colorThemeDark = fyne.NewMenuItem("Dark", func() {
		variantPref = "dark"
		applyTheme()
		updateMenuChecks()
		window.Content().Refresh()
	})

	readerCompact = fyne.NewMenuItem("Compact", func() {
		applyPreset("compact")
		applyTheme()
		applyLayout()
		updateMenuChecks()
		window.Content().Refresh()
	})
	readerGitHub = fyne.NewMenuItem("GitHub-ish", func() {
		applyPreset("github")
		applyTheme()
		applyLayout()
		updateMenuChecks()
		window.Content().Refresh()
	})
	readerNewspaper = fyne.NewMenuItem("Newspaper", func() {
		applyPreset("newspaper")
		applyTheme()
		applyLayout()
		updateMenuChecks()
		window.Content().Refresh()
	})

	colorMenu := fyne.NewMenu("Color Theme", colorThemeSystem, colorThemeLight, colorThemeDark)
	readerMenu := fyne.NewMenu("Reader Preset", readerCompact, readerGitHub, readerNewspaper)

	zoomIn := fyne.NewMenuItem("Zoom In", func() {
		textScale = clamp(textScale+0.05, 0.75, 1.75)
		markCustom()
		applyAndPersist()
		updateMenuChecks()
	})
	zoomOut := fyne.NewMenuItem("Zoom Out", func() {
		textScale = clamp(textScale-0.05, 0.75, 1.75)
		markCustom()
		applyAndPersist()
		updateMenuChecks()
	})
	zoomReset := fyne.NewMenuItem("Zoom Reset", func() {
		textScale = 1.0
		markCustom()
		applyAndPersist()
		updateMenuChecks()
	})
	zoomMenu := fyne.NewMenu("Text Size", zoomIn, zoomOut, zoomReset)

	widthNarrower := fyne.NewMenuItem("Narrower", func() {
		maxWidth = clamp(maxWidth-60, 520, 1600)
		markCustom()
		applyAndPersist()
		updateMenuChecks()
	})
	widthWider := fyne.NewMenuItem("Wider", func() {
		maxWidth = clamp(maxWidth+60, 520, 1600)
		markCustom()
		applyAndPersist()
		updateMenuChecks()
	})
	widthMenu := fyne.NewMenu("Width", widthNarrower, widthWider)

	padLess := fyne.NewMenuItem("Less Padding", func() {
		padScale = clamp(padScale-0.1, 0.5, 2.0)
		markCustom()
		applyAndPersist()
		updateMenuChecks()
	})
	padMore := fyne.NewMenuItem("More Padding", func() {
		padScale = clamp(padScale+0.1, 0.5, 2.0)
		markCustom()
		applyAndPersist()
		updateMenuChecks()
	})
	padMenu := fyne.NewMenu("Padding", padLess, padMore)

	settingsItem := fyne.NewMenuItem("Settings...", func() {
		textLabel := widget.NewLabel(fmt.Sprintf("%.2fx", textScale))
		padLabel := widget.NewLabel(fmt.Sprintf("%.2fx", padScale))
		widthLabel := widget.NewLabel(fmt.Sprintf("%d px", int(maxWidth)))

		textSlider := widget.NewSlider(0.75, 1.75)
		textSlider.Step = 0.05
		textSlider.Value = float64(textScale)
		textSlider.OnChanged = func(v float64) {
			textScale = float32(v)
			textLabel.SetText(fmt.Sprintf("%.2fx", textScale))
			markCustom()
			applyAndPersist()
			updateMenuChecks()
		}

		padSlider := widget.NewSlider(0.5, 2.0)
		padSlider.Step = 0.05
		padSlider.Value = float64(padScale)
		padSlider.OnChanged = func(v float64) {
			padScale = float32(v)
			padLabel.SetText(fmt.Sprintf("%.2fx", padScale))
			markCustom()
			applyAndPersist()
			updateMenuChecks()
		}

		widthSlider := widget.NewSlider(520, 1600)
		widthSlider.Step = 20
		widthSlider.Value = float64(maxWidth)
		widthSlider.OnChanged = func(v float64) {
			maxWidth = float32(v)
			widthLabel.SetText(fmt.Sprintf("%d px", int(maxWidth)))
			markCustom()
			applyAndPersist()
			updateMenuChecks()
		}

		content := container.NewVBox(
			container.NewBorder(nil, nil, widget.NewLabel("Text size"), textLabel, textSlider),
			container.NewBorder(nil, nil, widget.NewLabel("Padding"), padLabel, padSlider),
			container.NewBorder(nil, nil, widget.NewLabel("Max width"), widthLabel, widthSlider),
		)

		d := dialog.NewCustom("View Settings", "Close", content, window)
		d.Show()
	})

	colorThemeItem := fyne.NewMenuItem("Color Theme", nil)
	colorThemeItem.ChildMenu = colorMenu
	readerPresetItem := fyne.NewMenuItem("Reader Preset", nil)
	readerPresetItem.ChildMenu = readerMenu
	textSizeItem := fyne.NewMenuItem("Text Size", nil)
	textSizeItem.ChildMenu = zoomMenu
	widthItem := fyne.NewMenuItem("Width", nil)
	widthItem.ChildMenu = widthMenu
	paddingItem := fyne.NewMenuItem("Padding", nil)
	paddingItem.ChildMenu = padMenu

	viewMenu := fyne.NewMenu("View",
		colorThemeItem,
		readerPresetItem,
		fyne.NewMenuItemSeparator(),
		textSizeItem,
		widthItem,
		paddingItem,
		fyne.NewMenuItemSeparator(),
		settingsItem,
	)

	// Create a menu
	fileMenu := fyne.NewMenu("File", openItem)
	mainMenu = fyne.NewMainMenu(fileMenu, viewMenu)
	updateMenuChecks()
	window.SetMainMenu(mainMenu)

	// Show the window
	window.ShowAndRun()
}
