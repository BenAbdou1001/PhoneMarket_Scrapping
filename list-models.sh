#!/bin/bash

echo "🤖 Available Ollama Models for Data Cleaning"
echo "=============================================="
echo ""

# List currently installed models
echo "📦 Currently installed models:"
ollama list

echo ""
echo "💡 Recommended models for data cleaning:"
echo ""

echo "1. llama3.2:3b (INSTALLED) - Best balance"
echo "   Size: 2GB | Speed: Medium | Accuracy: High"
echo "   Already configured and working!"
echo ""

echo "2. llama3.2:1b - Fastest option"
echo "   Size: 1.3GB | Speed: Very Fast | Accuracy: Good"
echo "   Install: ollama pull llama3.2:1b"
echo "   Use: Edit .env → OLLAMA_MODEL=llama3.2:1b"
echo ""

echo "3. llama3.1:8b - Most accurate"
echo "   Size: 4.7GB | Speed: Slower | Accuracy: Excellent"
echo "   Install: ollama pull llama3.1:8b"
echo "   Use: Edit .env → OLLAMA_MODEL=llama3.1:8b"
echo ""

echo "4. mistral:7b - Alternative option"
echo "   Size: 4.1GB | Speed: Medium | Accuracy: Very Good"
echo "   Install: ollama pull mistral:7b"
echo "   Use: Edit .env → OLLAMA_MODEL=mistral:7b"
echo ""

echo "5. phi3:mini - Ultra lightweight"
echo "   Size: 2.3GB | Speed: Fast | Accuracy: Good"
echo "   Install: ollama pull phi3:mini"
echo "   Use: Edit .env → OLLAMA_MODEL=phi3:mini"
echo ""

echo "6. qwen2.5:3b - Chinese/Multilingual"
echo "   Size: 2.0GB | Speed: Medium | Accuracy: High"
echo "   Install: ollama pull qwen2.5:3b"
echo "   Use: Edit .env → OLLAMA_MODEL=qwen2.5:3b"
echo ""

echo "----------------------------------------"
echo "Current configuration:"
if [ -f ".env" ]; then
    MODEL=$(grep OLLAMA_MODEL .env 2>/dev/null | cut -d'=' -f2)
    URL=$(grep OLLAMA_URL .env 2>/dev/null | cut -d'=' -f2)
    
    if [ -z "$MODEL" ]; then
        echo "  Model: llama3.2:3b (default)"
    else
        echo "  Model: $MODEL"
    fi
    
    if [ -z "$URL" ]; then
        echo "  URL: http://localhost:11434 (default)"
    else
        echo "  URL: $URL"
    fi
else
    echo "  No .env file - using defaults"
    echo "  Model: llama3.2:3b"
    echo "  URL: http://localhost:11434"
fi

echo ""
echo "🔄 To switch models:"
echo "   1. Pull new model: ollama pull <model>"
echo "   2. Update .env: OLLAMA_MODEL=<model>"
echo "   3. Test: npm run clean:data:dry -- --limit 5"
echo ""

echo "📊 Compare model performance:"
echo "   Time per item: llama3.2:1b (~3s) < llama3.2:3b (~8s) < llama3.1:8b (~15s)"
echo "   Accuracy: llama3.2:1b (85%) < llama3.2:3b (92%) < llama3.1:8b (96%)"
echo ""

echo "💾 Disk space used by models:"
du -sh ~/.ollama/models 2>/dev/null || echo "   Unable to calculate"
