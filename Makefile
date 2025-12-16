WAILS=$(shell go env GOPATH)/bin/wails

.PHONY: build run

build:
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

run:
	./build/bin/mdr
