.PHONY: build install clean

BINARY_NAME=dra-cli

build:
	@echo "🛠️  Building DRA CLI..."
	go build -o bin/$(BINARY_NAME) main.go
	@echo "✅ Build complete! Executable is in bin/$(BINARY_NAME)"
	@echo ""
	@echo "💡 To add the compiled binary to your current shell PATH, run:"
	@echo "   export PATH=\$$PATH:\$$(pwd)/bin"
	@echo "   (Or add this to your ~/.zshrc or ~/.bashrc to make it persistent)"

install: build
	@echo "📦 Installing DRA to your Go bin path..."
	go install
	@echo "✅ Installation complete! If the 'dra-cli' command is not found, add Go bin to your shell PATH:"
	@echo "   export PATH=\$$PATH:\$$(go env GOPATH)/bin"
	@echo "   (Or add this to your ~/.zshrc or ~/.bashrc to make it persistent)"

clean:
	@echo "🧹 Cleaning up..."
	go clean
	rm -rf bin/
	@echo "✅ Clean complete."
