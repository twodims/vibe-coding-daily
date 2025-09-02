# AI Programming News Website

A daily AI programming news website deployed on GitHub Pages.

## Features
- Daily AI programming news collection
- Static site generation
- Automatic deployment to GitHub Pages

## Project Structure
```
.
├── src/
│   ├── collector/     # News collection scripts
│   ├── generator/     # Site generation scripts
│   ├── templates/     # HTML templates
│   └── static/        # CSS, JS, images
├── content/           # Generated content
├── dist/              # Built site (deployed to gh-pages)
└── scripts/           # Automation scripts
```

## Setup
1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

## Daily Update Command
```bash
./scripts/update-and-deploy.sh
```

This command will:
1. Collect today's AI programming news
2. Generate the website
3. Deploy to GitHub Pages