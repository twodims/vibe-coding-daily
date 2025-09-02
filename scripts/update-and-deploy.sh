#!/bin/bash

# AI Programming News Daily Update Script
# This script collects daily news and deploys to GitHub Pages

set -e  # Exit on any error

echo "🚀 Starting AI Programming News update..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your API keys before running again."
    exit 0
fi

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)

echo "📰 Collecting today's AI programming news..."
npm run collect

echo "🏗️  Generating website..."
npm run generate

echo "📤 Deploying to GitHub Pages..."

# Switch to gh-pages branch if it exists, otherwise create it
if git show-ref --quiet refs/heads/gh-pages; then
    git checkout gh-pages
    git pull origin gh-pages
else
    git checkout --orphan gh-pages
    git rm -rf .
    touch .nojekyll
    echo "# AI Programming News" > README.md
    git add .nojekyll README.md
    git commit -m "Initial gh-pages setup"
fi

# Copy dist files to current directory
cp -r dist/* .

# Add all files
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to deploy"
else
    git commit -m "Daily news update - $(date +%Y-%m-%d)"
    
    # Push to GitHub
    echo "🌍 Pushing to GitHub..."
    git push origin gh-pages
    
    echo "✅ Successfully deployed to GitHub Pages!"
fi

# Switch back to original branch
git checkout "$CURRENT_BRANCH"

echo "🎉 Update complete! Your AI programming news site has been updated."
echo "🌐 Visit your site at: https://twodims.github.io/vibe-coding-daily/"