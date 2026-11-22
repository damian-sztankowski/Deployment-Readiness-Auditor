.PHONY: build test install clean

BINARY_NAME=dra-cli

build:
	@echo "🛠️  Building DRA CLI v3.0..."
	go build -ldflags="-s -w" -o bin/$(BINARY_NAME) .
	@echo "✅ Build complete! Executable is in bin/$(BINARY_NAME)"

test:
	@echo "🧪 Running DRA CLI unit tests..."
	go test -v -race ./...

install: build
	@echo "📦 Installing DRA CLI to Go bin path..."
	go install .

clean:
	@echo "🧹 Cleaning up..."
	go clean
	rm -rf bin/
