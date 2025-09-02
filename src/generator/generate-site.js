const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Function to convert HTML entities back to HTML
function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Simple template engine
function renderTemplate(template, data) {
  let result = template;
  
  // Handle each loops first
  result = result.replace(/\{\{#each ([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, loopTemplate) => {
    const array = data[arrayKey.trim()];
    if (!Array.isArray(array)) return '';
    
    return array.map(item => {
      let itemHtml = loopTemplate;
      
      // Handle this.properties in the loop
      itemHtml = itemHtml.replace(/\{\{this\.([^}]+)\}\}/g, (m, prop) => {
        const value = item[prop] || '';
        
        // Handle truncate helper for description
        if (prop === 'description' && value) {
          const truncateMatch = loopTemplate.match(/\{\{truncate this\.description (\d+)\}\}/);
          if (truncateMatch) {
            const length = parseInt(truncateMatch[1]);
            return truncate(value, length);
          }
        }
        
        return value;
      });
      
      // Handle formatDate for pubDate
      itemHtml = itemHtml.replace(/\{\{formatDate this\.pubDate\}\}/g, (m) => {
        return formatDate(item.pubDate);
      });
      
      // Handle conditional blocks
      itemHtml = itemHtml.replace(/\{\{#if this\.([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (m, condition, content) => {
        return item[condition] ? content : '';
      });
      
      // Handle decodeHtml helper
      itemHtml = itemHtml.replace(/\{\{decodeHtml this\.description\}\}/g, (m) => {
        return decodeHtmlEntities(item.description || '');
      });
      
      return itemHtml;
    }).join('');
  });
  
  // Handle simple variables
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmed = key.trim();
    
    // formatDate helper
    if (trimmed.startsWith('formatDate ')) {
      const dateStr = trimmed.replace('formatDate ', '').trim();
      return formatDate(dateStr);
    }
    
    // lookup helper for archive
    if (trimmed.startsWith('lookup ')) {
      const match = trimmed.match(/lookup ([^ ]+) ([^ ]+)/);
      if (match) {
        const obj = match[1];
        const key = match[2];
        return data[obj] && data[obj][key] ? data[obj][key] : '';
      }
    }
    
    return data[trimmed] || '';
  });
  
  return result;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function truncate(text, length) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

function loadContent() {
  const contentDir = path.join(__dirname, '../../content');
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.json'));
  
  const content = {};
  files.forEach(file => {
    const date = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf8'));
    content[date] = data;
  });
  
  return content;
}

function generateIndexPage(content, distDir) {
  const templatePath = path.join(__dirname, '../templates/index.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Get today's content or most recent
  const today = new Date().toISOString().split('T')[0];
  const dates = Object.keys(content).sort().reverse();
  const latestDate = dates.includes(today) ? today : dates[0];
  const news = content[latestDate] || [];
  
  const html = renderTemplate(template, {
    date: formatDate(latestDate),
    newsCount: news.length,
    news: news
  });
  
  fs.writeFileSync(path.join(distDir, 'index.html'), html);
  console.log(`Generated index page for ${latestDate}`);
}

function generateDailyPages(content, distDir) {
  const indexTemplate = fs.readFileSync(path.join(__dirname, '../templates/index.html'), 'utf8');
  
  Object.keys(content).forEach(date => {
    const news = content[date];
    const html = renderTemplate(indexTemplate, {
      date: formatDate(date),
      newsCount: news.length,
      news: news
    });
    
    const dateDir = path.join(distDir, date);
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(dateDir, 'index.html'), html);
  });
  
  console.log(`Generated ${Object.keys(content).length} daily pages`);
}

function generateArchivePage(content, distDir) {
  const templatePath = path.join(__dirname, '../templates/archive.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  const dates = Object.keys(content).sort().reverse();
  const counts = {};
  dates.forEach(date => {
    counts[date] = content[date].length;
  });
  
  const html = renderTemplate(template, {
    dates: dates,
    counts: counts
  });
  
  const archiveDir = path.join(distDir, 'archive');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(archiveDir, 'index.html'), html);
  console.log('Generated archive page');
}

function copyStaticFiles(distDir) {
  const staticDir = path.join(__dirname, '../static');
  const targetDir = path.join(distDir, 'static');
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const files = fs.readdirSync(staticDir);
  files.forEach(file => {
    fs.copyFileSync(
      path.join(staticDir, file),
      path.join(targetDir, file)
    );
  });
  
  console.log('Copied static files');
}

async function generateSite() {
  console.log('Generating site...');
  
  const distDir = path.join(__dirname, '../../docs'); // Output to docs directory for GitHub Pages
  
  // Clean docs directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
  
  // Load content
  const content = loadContent();
  
  // Generate pages
  generateIndexPage(content, distDir);
  generateDailyPages(content, distDir);
  generateArchivePage(content, distDir);
  copyStaticFiles(distDir);
  
  // Copy .nojekyll and CNAME if they exist
  const nojekyllPath = path.join(__dirname, '../../.nojekyll');
  if (fs.existsSync(nojekyllPath)) {
    fs.copyFileSync(nojekyllPath, path.join(distDir, '.nojekyll'));
  }
  
  const cnamePath = path.join(__dirname, '../../CNAME');
  if (fs.existsSync(cnamePath)) {
    fs.copyFileSync(cnamePath, path.join(distDir, 'CNAME'));
  }
  
  console.log('Site generated successfully!');
}

if (require.main === module) {
  generateSite().catch(console.error);
}

module.exports = { generateSite };