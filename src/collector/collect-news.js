const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const RSS_FEEDS = process.env.RSS_FEEDS ? process.env.RSS_FEEDS.split(',') : [];
const NEWS_SOURCES = [
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    selector: '.titleline > a',
    baseUrl: 'https://news.ycombinator.com'
  },
  {
    name: 'Reddit r/MachineLearning',
    url: 'https://www.reddit.com/r/MachineLearning/.rss',
    isRSS: true
  },
  {
    name: 'AI News',
    url: 'https://www.artificialintelligence-news.com/feed/',
    isRSS: true
  },
  {
    name: '机器之心',
    url: 'https://www.jiqizhixin.com/rss',
    isRSS: true
  },
  {
    name: 'AI科技大本营',
    url: 'https://blog.csdn.net/qq_41839688/rss/list',
    isRSS: true
  },
  {
    name: 'InfoQ 中文',
    url: 'https://www.infoq.cn/feed',
    isRSS: true
  },
  {
    name: '36氪',
    url: 'https://36kr.com/feed',
    isRSS: true
  }
];

async function fetchRSSFeed(feedUrl) {
  try {
    const response = await axios.get(feedUrl);
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    // Find source name from NEWS_SOURCES
    const sourceInfo = NEWS_SOURCES.find(s => s.url === feedUrl);
    const sourceName = sourceInfo ? sourceInfo.name : feedUrl;
    
    const items = [];
    $('item').each((i, item) => {
      const $item = $(item);
      items.push({
        title: $item.find('title').text(),
        link: $item.find('link').text(),
        description: $item.find('description').text(),
        pubDate: $item.find('pubDate').text(),
        source: sourceName
      });
    });
    
    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error.message);
    return [];
  }
}

async function scrapeWebsite(source) {
  try {
    const response = await axios.get(source.url);
    const $ = cheerio.load(response.data);
    
    const items = [];
    $(source.selector).each((i, element) => {
      const $el = $(element);
      const title = $el.text();
      const link = $el.attr('href');
      
      if (title && link) {
        items.push({
          title: title.trim(),
          link: link.startsWith('http') ? link : `${source.baseUrl}${link}`,
          source: source.name
        });
      }
    });
    
    return items.slice(0, 10); // Limit to 10 items per source
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error.message);
    return [];
  }
}

function filterAINews(items) {
  const aiKeywords = [
    // English keywords
    'AI', 'artificial intelligence', 'machine learning', 'deep learning',
    'neural network', 'GPT', 'LLM', 'language model', 'ChatGPT',
    'Claude', 'Gemini', 'automation', 'coding assistant', 'GitHub Copilot',
    'OpenAI', 'Anthropic', 'Google AI', 'Microsoft AI',
    // Chinese keywords
    '人工智能', 'AI', '机器学习', '深度学习', '神经网络',
    '大模型', '语言模型', '自动化', '编程助手', '代码生成',
    '智能编程', 'AI编程', '开发工具', 'Copilot', 'ChatGPT',
    '文心一言', '通义千问', '智谱AI', '百度AI', '阿里AI'
  ];
  
  return items.filter(item => {
    const text = (item.title + ' ' + (item.description || '')).toLowerCase();
    return aiKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  });
}

async function collectNews() {
  console.log('正在收集AI编程新闻...');
  
  let allNews = [];
  
  // Fetch from RSS feeds
  for (const feedUrl of RSS_FEEDS) {
    const items = await fetchRSSFeed(feedUrl);
    allNews = allNews.concat(items);
  }
  
  // Scrape websites
  for (const source of NEWS_SOURCES) {
    if (source.isRSS) {
      const items = await fetchRSSFeed(source.url);
      allNews = allNews.concat(items);
    } else {
      const items = await scrapeWebsite(source);
      allNews = allNews.concat(items);
    }
  }
  
  // Filter AI-related news
  const aiNews = filterAINews(allNews);
  
  // Remove duplicates
  const uniqueNews = aiNews.filter((item, index, self) =>
    index === self.findIndex(t => t.title === item.title)
  );
  
  // Sort by date (if available) or keep original order
  const sortedNews = uniqueNews.sort((a, b) => {
    if (a.pubDate && b.pubDate) {
      return new Date(b.pubDate) - new Date(a.pubDate);
    }
    return 0;
  });
  
  // Save to file
  const today = new Date().toISOString().split('T')[0];
  const contentDir = path.join(__dirname, '../../content');
  
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }
  
  const filePath = path.join(contentDir, `${today}.json`);
  fs.writeFileSync(filePath, JSON.stringify(sortedNews, null, 2));
  
  console.log(`已收集 ${sortedNews.length} 条AI新闻 ${today}`);
  return sortedNews;
}

if (require.main === module) {
  collectNews().catch(console.error);
}

module.exports = { collectNews };