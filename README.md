# AI编程日报

一个部署在 GitHub Pages 上的每日AI编程新闻网站。

## 功能特性
- 每日收集AI编程新闻
- 静态网站生成
- 自动部署到 GitHub Pages
- 支持中英文新闻源
- 深色/浅色主题切换

## 项目结构
```
.
├── src/
│   ├── collector/     # 新闻收集脚本
│   ├── generator/     # 网站生成脚本
│   ├── templates/     # HTML模板
│   └── static/        # CSS, JS, 图片
├── content/           # 生成的内容
├── docs/              # 构建的网站（部署到GitHub Pages）
└── scripts/           # 自动化脚本
```

## 安装设置
1. 安装依赖：
```bash
npm install
```

2. 设置环境变量（可选）：
```bash
cp .env.example .env
# 编辑 .env 文件添加你的API密钥
```

## 每日更新命令
```bash
./scripts/update-and-deploy.sh
```

此命令会：
1. 收集今日的AI编程新闻
2. 生成网站
3. 部署到 GitHub Pages

## 新闻源
- Hacker News
- Reddit r/MachineLearning
- AI News
- 机器之心
- AI科技大本营
- InfoQ 中文
- 36氪

## 技术栈
- Node.js
- Axios（HTTP请求）
- Cheerio（HTML解析）
- 原生JavaScript（无框架）

## 许可证
MIT