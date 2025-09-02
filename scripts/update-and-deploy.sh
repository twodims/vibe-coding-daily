#!/bin/bash

# AI Programming News Daily Update Script
# This script collects daily news and generates the website

set -e  # Exit on any error

echo "🚀 Starting AI Programming News update..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "📰 Collecting today's AI programming news..."
npm run collect

echo "🏗️  Generating website..."
npm run generate

# Add and commit changes
echo "💾 Committing changes..."
git add docs/
git commit -m "Daily news update - $(date +%Y-%m-%d)"

echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Update complete! Your AI programming news site has been updated."
echo "🌐 Visit your site at: https://twodims.github.io/vibe-coding-daily/"