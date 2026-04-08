#!/bin/bash

# SecureChat - Quick Start Setup Script
# This script sets up and starts the SecureChat application

echo "🔒 SecureChat - Secure Group Chat Application"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the securechat-app directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create public directory if it doesn't exist
mkdir -p public

echo "✨ Setup complete!"
echo ""
echo "🚀 Starting SecureChat server..."
echo "================================"
echo ""
echo "📌 Server Information:"
echo "   URL: http://localhost:3000"
echo "   WebSocket: ws://localhost:3000"
echo ""
echo "💡 Tips:"
echo "   - Open http://localhost:3000 in your browser"
echo "   - Create a new room or join an existing one"
echo "   - Share the Room ID with up to 4 other people"
echo ""
echo "🛑 To stop the server, press Ctrl+C"
echo ""

# Start the server
npm start
