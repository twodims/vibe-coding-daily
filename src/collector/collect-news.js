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
  }
];

async function fetchRSSFeed(feedUrl) {
  try {
    const response = await axios.get(feedUrl);
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    const items = [];
    $('item').each((i, item) => {
      const $item = $(item);
      items.push({
        title: $item.find('title').text(),
        link: $item.find('link').text(),
        description: $item.find('description').text(),
        pubDate: $item.find('pubDate').text(),
        source: feedUrl
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
    'AI', 'artificial intelligence', 'machine learning', 'deep learning',
    'neural network', 'GPT', 'LLM', 'language model', 'ChatGPT',
    'Claude', 'Gemini', 'automation', 'coding assistant', 'GitHub Copilot',
    'OpenAI', 'Anthropic', 'Google AI', 'Microsoft AI'
  ];
  
  return items.filter(item => {
    const text = (item.title + ' ' + (item.description || '')).toLowerCase();
    return aiKeywords.some(keyword => text.includes(keyword.toLowerCase()));
  });
}

async function collectNews() {
  console.log('Collecting AI programming news...');
  
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
  
  console.log(`Collected ${sortedNews.length} AI news items for ${today}`);
  return sortedNews;
}

if (require.main === module) {
  collectNews().catch(console.error);
}

module.exports = { collectNews };