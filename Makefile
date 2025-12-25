WAILS=$(shell go env GOPATH)/bin/wails

# Detect the operating system
UNAME_S := $(shell uname -s)

.PHONY: all mdr mde build run dev dev-mdr dev-mde clean install install-mdr install-mde install_themes

# Build all targets
all: mdr mde

# Build just mdr
mdr:
	@mkdir -p build/bin
	@mkdir -p cmd/mdr/frontend/dist
	@touch cmd/mdr/frontend/dist/.wails-embed-placeholder
ifeq ($(UNAME_S),Darwin)
	@echo "Building mdr for macOS..."
	cd cmd/mdr && $(WAILS) build -o ../../build/bin/mdr
else ifeq ($(UNAME_S),Linux)
	@echo "Building mdr for Linux..."
	@if pkg-config --exists webkit2gtk-4.0; then \
		echo "Building with WebKit 4.0..."; \
		cd cmd/mdr && $(WAILS) build -o ../../build/bin/mdr; \
	elif pkg-config --exists webkit2gtk-4.1; then \
		echo "Building with WebKit 4.1..."; \
		cd cmd/mdr && $(WAILS) build -tags webkit2_41 -o ../../build/bin/mdr; \
	else \
		echo "Error: Neither webkit2gtk-4.0 nor webkit2gtk-4.1 found."; \
		echo "Please install libwebkit2gtk-4.1-dev or libwebkit2gtk-4.0-dev."; \
		exit 1; \
	fi
else ifeq ($(UNAME_S),MINGW64_NT)
	@echo "Building mdr for Windows..."
	cd cmd/mdr && $(WAILS) build -o ../../build/bin/mdr.exe
else
	@echo "Unsupported platform: $(UNAME_S)"
	@exit 1
endif

# Build just mde
mde:
	@mkdir -p build/bin
	@mkdir -p cmd/mde/frontend/dist
	@touch cmd/mde/frontend/dist/.wails-embed-placeholder
ifeq ($(UNAME_S),Darwin)
	@echo "Building mde for macOS..."
	cd cmd/mde && $(WAILS) build -o ../../build/bin/mde
else ifeq ($(UNAME_S),Linux)
	@echo "Building mde for Linux..."
	@if pkg-config --exists webkit2gtk-4.0; then \
		echo "Building with WebKit 4.0..."; \
		cd cmd/mde && $(WAILS) build -o ../../build/bin/mde; \
	elif pkg-config --exists webkit2gtk-4.1; then \
		echo "Building with WebKit 4.1..."; \
		cd cmd/mde && $(WAILS) build -tags webkit2_41 -o ../../build/bin/mde; \
	else \
		echo "Error: Neither webkit2gtk-4.0 nor webkit2gtk-4.1 found."; \
		echo "Please install libwebkit2gtk-4.1-dev or libwebkit2gtk-4.0-dev."; \
		exit 1; \
	fi
else ifeq ($(UNAME_S),MINGW64_NT)
	@echo "Building mde for Windows..."
	cd cmd/mde && $(WAILS) build -o ../../build/bin/mde.exe
else
	@echo "Unsupported platform: $(UNAME_S)"
	@exit 1
endif

# Alias for backward compatibility
build: mdr

# Development mode - runs wails dev for mdr
dev: dev-mdr

dev-mdr:
	cd cmd/mdr && $(WAILS) dev

dev-mde:
	cd cmd/mde && $(WAILS) dev

# Run the built application
run:
ifeq ($(UNAME_S),Darwin)
	./build/bin/mdr.app/Contents/MacOS/mdr
else ifeq ($(UNAME_S),Linux)
	./build/bin/mdr
else ifeq ($(UNAME_S),MINGW64_NT)
	./build/bin/mdr.exe
endif

# Install the application based on OS
install: install-mdr install-mde

install-mdr: mdr
ifeq ($(UNAME_S),Darwin)
	@echo "Installing mdr for macOS..."
	@mkdir -p ~/Applications
	@cp -r cmd/mdr/build/bin/mdr.app ~/Applications/
	@echo "Installed mdr.app to ~/Applications/"
	@mkdir -p ~/bin
	@ln -sf "$$HOME/Applications/mdr.app/Contents/MacOS/mdr" "$$HOME/bin/mdr"
	@echo "Linked mdr binary to ~/bin/mdr"
	$(MAKE) install_themes
else ifeq ($(UNAME_S),Linux)
	@echo "Installing mdr for Linux..."
	@cp build/bin/mdr /usr/local/bin/
	@chmod +x /usr/local/bin/mdr
	@echo "Installed mdr binary to /usr/local/bin/"
	@echo "Note: Run 'make install_themes' as your normal user to install themes."
else ifeq ($(UNAME_S),MINGW64_NT)
	@echo "Installing mdr for Windows..."
	@echo "Windows installation not yet implemented"
else
	@echo "Unsupported platform for installation: $(UNAME_S)"
	@exit 1
endif

install-mde: mde
ifeq ($(UNAME_S),Darwin)
	@echo "Installing mde for macOS..."
	@mkdir -p ~/Applications
	@cp -r cmd/mde/build/bin/mde.app ~/Applications/
	@echo "Installed mde.app to ~/Applications/"
	@mkdir -p ~/bin
	@ln -sf "$$HOME/Applications/mde.app/Contents/MacOS/mde" "$$HOME/bin/mde"
	@echo "Linked mde binary to ~/bin/mde"
else ifeq ($(UNAME_S),Linux)
	@echo "Installing mde for Linux..."
	@cp build/bin/mde /usr/local/bin/
	@chmod +x /usr/local/bin/mde
	@echo "Installed mde binary to /usr/local/bin/"
else ifeq ($(UNAME_S),MINGW64_NT)
	@echo "Installing mde for Windows..."
	@echo "Windows installation not yet implemented"
else
	@echo "Unsupported platform for installation: $(UNAME_S)"
	@exit 1
endif

# Install themes to user config directory
install_themes:
	@mkdir -p "$$HOME/.config/mdr/mdthemes"
	@cp -f modman.css nordic.css "$$HOME/.config/mdr/mdthemes/"
	@echo "Installed themes to $$HOME/.config/mdr/mdthemes"

# Clean build artifacts
clean:
	rm -rf build/bin
	rm -rf cmd/mdr/build cmd/mdr/frontend/dist
	rm -rf cmd/mde/build cmd/mde/frontend/dist
