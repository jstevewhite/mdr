# mdr

`mdr` is a cross-platform Markdown viewer.

## Primary App (Wails)

The actively developed app lives in:

- `wails-mdr/`

It uses:

- Go backend + Goldmark for Markdown rendering
- Wails (WebView-based UI)
- CSS layout themes from `~/.config/mdr/mdthemes/`
- Persisted settings in `~/.config/mdr/mdr.conf`

For development and packaging instructions, see:

- `wails-mdr/README.md`

## Themes

To add a custom layout theme, drop a `.css` file into:

- `~/.config/mdr/mdthemes/`

The theme name is the filename without the `.css` extension.

## Legacy/Experimental Code

There is also older/experimental GUI code under:

- `cmd/mdr/`
