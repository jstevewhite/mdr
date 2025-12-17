WAILS=$(shell go env GOPATH)/bin/wails

# Detect the operating system
UNAME_S := $(shell uname -s)

.PHONY: build run dev clean install

# Universal build target - automatically detects OS
build:
ifeq ($(UNAME_S),Darwin)
	@echo "Building for macOS..."
	$(WAILS) build
else ifeq ($(UNAME_S),Linux)
	@echo "Building for Linux..."
	@if pkg-config --exists webkit2gtk-4.0; then \
		echo "Building with WebKit 4.0..."; \
		$(WAILS) build; \
	elif pkg-config --exists webkit2gtk-4.1; then \
		echo "Building with WebKit 4.1..."; \
		$(WAILS) build -tags webkit2_41; \
	else \
		echo "Error: Neither webkit2gtk-4.0 nor webkit2gtk-4.1 found."; \
		echo "Please install libwebkit2gtk-4.1-dev or libwebkit2gtk-4.0-dev."; \
		exit 1; \
	fi
else ifeq ($(UNAME_S),MINGW64_NT)
	@echo "Building for Windows..."
	$(WAILS) build
else
	@echo "Unsupported platform: $(UNAME_S)"
	@exit 1
endif

# Development mode - runs wails dev
dev:
	$(WAILS) dev

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
install:
ifeq ($(UNAME_S),Darwin)
	@echo "Installing for macOS..."
	@mkdir -p ~/Applications
	@cp -r build/bin/mdr.app ~/Applications/
	@echo "Installed mdr.app to ~/Applications/"
	@mkdir -p ~/bin
	@ln -sf "$$HOME/Applications/mdr.app/Contents/MacOS/mdr" "$$HOME/bin/mdr"
	@echo "Linked mdr binary to ~/bin/mdr"
else ifeq ($(UNAME_S),Linux)
	@echo "Installing for Linux..."
	@cp build/bin/mdr /usr/local/bin/
	@chmod +x /usr/local/bin/mdr
	@echo "Installed mdr binary to /usr/local/bin/"
else ifeq ($(UNAME_S),MINGW64_NT)
	@echo "Installing for Windows..."
	@echo "Windows installation not yet implemented"
else
	@echo "Unsupported platform for installation: $(UNAME_S)"
	@exit 1
endif

# Clean build artifacts
clean:
	rm -rf build/bin
	rm -rf frontend/dist
