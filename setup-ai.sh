#!/bin/bash

echo "🤖 AI Data Cleaning Setup for Phone Market Scraper"
echo "=================================================="
echo ""

# Check if Ollama is installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is already installed"
    OLLAMA_VERSION=$(ollama --version 2>&1 | head -n 1)
    echo "   Version: $OLLAMA_VERSION"
else
    echo "❌ Ollama is not installed"
    echo ""
    echo "📥 Installing Ollama..."
    echo ""
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Using Homebrew to install Ollama..."
            brew install ollama
        else
            echo "Homebrew not found. Please install Ollama manually:"
            echo "https://ollama.ai/download"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Installing Ollama on Linux..."
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        echo "Unsupported OS. Please install Ollama manually:"
        echo "https://ollama.ai/download"
        exit 1
    fi
fi

echo ""
echo "🚀 Starting Ollama service..."
# Start Ollama in background if not running
if ! pgrep -x "ollama" > /dev/null; then
    nohup ollama serve > /dev/null 2>&1 &
    sleep 3
    echo "✅ Ollama service started"
else
    echo "✅ Ollama service is already running"
fi

echo ""
echo "📦 Pulling llama3.2:3b model (2GB download)..."
echo "   This may take a few minutes..."
ollama pull llama3.2:3b

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "🎉 You can now use AI data cleaning:"
    echo "   npm run clean:data:dry    # Test without saving"
    echo "   npm run clean:data         # Clean Ouedkniss data"
    echo "   npm run clean:data:all     # Clean all marketplaces"
    echo ""
    echo "💡 Tips:"
    echo "   - Use --limit to process fewer items"
    echo "   - Use --dry-run to preview changes"
    echo "   - Ollama runs locally, no API keys needed"
else
    echo ""
    echo "❌ Model download failed"
    echo "   Try manually: ollama pull llama3.2:3b"
fi
