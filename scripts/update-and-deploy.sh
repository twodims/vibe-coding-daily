#!/bin/bash

# AI编程日报每日更新脚本
# 此脚本收集每日新闻并生成网站

set -e  # 遇到错误时退出

echo "🚀 开始更新AI编程日报..."

# 如果 node_modules 不存在则安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo "📰 收集今日AI编程新闻..."
npm run collect

echo "🏗️  生成网站..."
npm run generate

# 添加并提交更改
echo "💾 提交更改..."
git add docs/
git commit -m "每日新闻更新 - $(date +%Y-%m-%d)"

echo "📤 推送到GitHub..."
git push origin main

echo "✅ 更新完成！你的AI编程日报网站已更新。"
echo "🌐 访问网站：https://twodims.github.io/vibe-coding-daily/"