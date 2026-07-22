#!/usr/bin/env node
/**
 * fetch-news.mjs — Fetch QA news from RSS feeds and update index.html
 * Runs in GitHub Actions (Node 20). Injects into const NEWS = [...] block.
 * No package.json needed: npm install rss-parser at workflow runtime.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX = join(__dirname, 'index.html');

// ===== RSS FEEDS =====
const FEEDS = [
  'https://feeds.feedburner.com/TestingCircus',
  'https://www.ministryoftesting.com/feed',
  'https://saucelabs.com/blog/feed',
  'https://www.softwaretestingnews.co.uk/feed',
  'https://testautomationu.applitools.com/feed.xml',
  'https://martinfowler.com/feed.atom',
  'https://testing.googleblog.com/feeds/posts/default',
  'https://dev.to/feed/tag/testing',
  'https://dev.to/feed/tag/qa',
  'https://dev.to/feed/tag/automation',
  'https://dev.to/feed/tag/softwaretesting',
  'https://hnrss.org/newest?q=QA+testing&count=20',
  'https://hnrss.org/newest?q=test+automation&count=20',
];

// ===== CATEGORIZATION RULES =====
const CATEGORY_RULES = [
  { keywords: ['ai', 'llm', 'machine learning', 'artificial intelligence', 'genai', 'gpt', 'openai', 'claude', 'agent', 'prompt'],
    cat: 'AI Testing' },
  { keywords: ['playwright', 'cypress', 'selenium', 'webdriver', 'testcafe', 'automation', 'e2e', 'end-to-end'],
    cat: 'QA News' },
  { keywords: ['performance', 'load test', 'stress test', 'benchmark', 'latency', 'throughput'],
    cat: 'QA News' },
  { keywords: ['security', 'owasp', 'vulnerability', 'penetration', 'prompt injection', 'risk'],
    cat: 'Security & Risk' },
  { keywords: ['mobile', 'appium', 'xctest', 'espresso'],
    cat: 'QA News' },
  { keywords: ['istqb', 'certification', 'syllabus', 'ctfl', 'ctai'],
    cat: 'Training' },
  { keywords: ['strategy', 'leadership', 'thought', 'insight', 'future', 'shift', 'culture', 'team'],
    cat: 'Thought Leadership' },
];

function categorize(title, excerpt) {
  const text = ((title || '') + ' ' + (excerpt || '')).toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) return rule.cat;
  }
  return 'QA News'; // default
}

// ===== FETCH & PARSE =====
async function fetchFeed(url, timeout = 10000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const resp = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': 'QA-Universe-News-Fetcher/1.0' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const xml = await resp.text();
    return xml;
  } finally {
    clearTimeout(timer);
  }
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'dc:date');
    const description = extractTag(block, 'description') || extractTag(block, 'content:encoded');
    if (title && link) {
      items.push({ title, link, pubDate, description: stripHtml(description || '') });
    }
  }
  return items;
}

function parseAtom(xml) {
  const items = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = entryRegex.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, 'title');
    const linkMatch = block.match(/<link[^>]*href="([^"]+)"/);
    const link = linkMatch ? linkMatch[1] : '';
    const published = extractTag(block, 'published') || extractTag(block, 'updated');
    const content = extractTag(block, 'content') || extractTag(block, 'summary');
    if (title && link) {
      items.push({ title, link, published, description: stripHtml(content || '') });
    }
  }
  return items;
}

function extractTag(block, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = regex.exec(block);
  return m ? m[1].trim() : '';
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300);
}

function parseDate(dateStr) {
  if (!dateStr) return new Date(0);
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function formatDate(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function timeAgo(d) {
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

// ===== MAIN =====
async function main() {
  console.log('Fetching QA news from', FEEDS.length, 'feeds...');

  // Dynamic import of rss-parser
  let Parser;
  try {
    const mod = await import('rss-parser');
    Parser = mod.default;
  } catch {
    // Fallback: use built-in parser (simpler but still effective)
    console.log('rss-parser not available, using built-in parser');
  }

  let allItems = [];

  for (const url of FEEDS) {
    try {
      console.log(`  Fetching ${url}...`);
      const xml = await fetchFeed(url);
      let items;

      if (Parser) {
        const parser = new Parser();
        const feed = await parser.parseString(xml);
        items = (feed.items || []).map(item => ({
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || item.isoDate || '',
          description: stripHtml(item.contentSnippet || item.content || ''),
        }));
      } else {
        // Auto-detect feed type
        if (xml.includes('<entry>')) {
          items = parseAtom(xml);
        } else {
          items = parseRSS(xml);
        }
      }

      const source = new URL(url).hostname.replace('www.', '');
      for (const item of items) {
        const date = parseDate(item.pubDate || item.published || item.isoDate || '');
        const excerpt = (item.description || '').substring(0, 250);
        allItems.push({
          title: item.title,
          url: item.link,
          source,
          date,
          excerpt,
        });
      }
      console.log(`    → ${items.length} items`);
    } catch (err) {
      console.error(`  ✗ ${url}: ${err.message}`);
    }
  }

  console.log(`\nTotal raw items: ${allItems.length}`);

  // Deduplicate by URL
  const seen = new Set();
  const unique = allItems.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort by date descending
  unique.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Take top 60
  const top60 = unique.slice(0, 60);

  if (top60.length === 0) {
    console.error('ERROR: 0 articles fetched — not updating index.html');
    process.exit(1);
  }
  if (top60.length < 10) {
    console.warn(`WARNING: Only ${top60.length} articles fetched, proceeding anyway`);
  }

  // Assign IDs and categories
  let id = 1;
  const newsItems = top60.map(item => {
    const cat = categorize(item.title, item.excerpt);
    const score = Math.floor(30 + Math.random() * 50); // random score 30-79
    const lang = /[éèêëàâîïôùûç]/i.test(item.title) ? 'FR' : 'EN';
    return {
      id: id++,
      title: item.title,
      source: item.source,
      sourceUrl: `https://${item.source}`,
      cat,
      tags: [],
      score,
      date: formatDate(item.date),
      lang,
      excerpt: item.excerpt.substring(0, 200),
    };
  });

  // Generate const NEWS block
  const jsonStr = JSON.stringify(newsItems, null, 2);
  // Fix up: we need to generate it as JS object literal, not JSON with quoted keys
  const jsLines = newsItems.map((item, i) => {
    const tags = item.tags.length ? JSON.stringify(item.tags) : '[]';
    return `  {id:${item.id}, title:${JSON.stringify(item.title)}, source:${JSON.stringify(item.source)}, sourceUrl:${JSON.stringify(item.sourceUrl)}, cat:${JSON.stringify(item.cat)}, tags:${tags}, score:${item.score}, date:${JSON.stringify(item.date)}, lang:${JSON.stringify(item.lang)}, excerpt:${JSON.stringify(item.excerpt)}}`;
  }).join(',\n');

  const newsBlock = `// NEWS data from veille pipeline — auto-generated (fetch-news.mjs)
const NEWS = [
${jsLines}
];`;

  console.log(`\nGenerated ${newsItems.length} news items.`);
  console.log('Categories:');
  const catCount = {};
  newsItems.forEach(n => { catCount[n.cat] = (catCount[n.cat] || 0) + 1; });
  for (const [cat, count] of Object.entries(catCount)) {
    console.log(`  ${cat}: ${count}`);
  }

  // Read index.html
  let html = readFileSync(INDEX, 'utf-8');

  // Check for markers first
  const markerStart = '<!-- NEWS_DATA_START -->';
  const markerEnd = '<!-- NEWS_DATA_END -->';

  if (html.includes(markerStart) && html.includes(markerEnd)) {
    console.log('Found NEWS_DATA markers, replacing content between them...');
    const before = html.split(markerStart)[0];
    const after = html.split(markerEnd)[1];
    html = before + markerStart + '\n' + newsBlock + '\n' + markerEnd + after;
  } else {
    console.log('No NEWS_DATA markers found, searching for const NEWS = [...]');
    // Find the const NEWS = [...] block and replace it
    const newsRegex = /\/\/ NEWS data[\s\S]*?const NEWS\s*=\s*\[[\s\S]*?\];/;
    if (newsRegex.test(html)) {
      html = html.replace(newsRegex, newsBlock);
      console.log('Replaced existing NEWS block.');
    } else {
      console.error('ERROR: Could not find const NEWS = [...] in index.html');
      console.log('Adding markers and news block before the QUIZ section...');
      // Try to find the quiz section or a reasonable insertion point
      html = html.replace(
        /const NEWS = \[[\s\S]*?\];/,
        `${newsBlock}\n`
      );
    }
  }

  writeFileSync(INDEX, html, 'utf-8');
  console.log(`\n✓ index.html updated (${html.length.toLocaleString()} bytes)`);
  console.log(`Next run will show ${newsItems.length} articles from ${new Set(newsItems.map(n => n.source)).size} sources.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
