import axios from 'axios';
import { extractPageContent, ExtractedPage } from './extractor.js';
import { CRAWL_DEFAULTS } from '../config.js';

export interface CrawlSettings {
  maxPages: number;
  maxDepth: number;
  rateLimitMs: number;
  timeoutMs: number;
}

// Pages to ignore
const BLACKLISTED_PATTERNS = [
  /login/i, /signup/i, /signin/i, /register/i, /auth/i, /logout/i,
  /privacy/i, /terms/i, /cookie/i, /legal/i, /disclaimer/i, /gdpr/i,
  /cart/i, /checkout/i, /basket/i, /order/i, /purchase/i,
  /search/i, /query/i, /filter/i,
  /\?.+=.+/i, // ignore URL query parameters for crawl paths to prevent query loops
];

// Helper to delay execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class WebCrawler {
  private visited = new Set<string>();
  private queue: { url: string; depth: number }[] = [];
  private crawledPages: ExtractedPage[] = [];
  private startUrl: string = '';
  private baseHostname: string = '';
  private settings: CrawlSettings;
  private onLog: (message: string, data?: any) => void;

  constructor(
    startUrl: string,
    settings: Partial<CrawlSettings> = {},
    onLog: (message: string, data?: any) => void = () => {}
  ) {
    this.settings = {
      maxPages: settings.maxPages ?? CRAWL_DEFAULTS.maxPages,
      maxDepth: settings.maxDepth ?? CRAWL_DEFAULTS.maxDepth,
      rateLimitMs: settings.rateLimitMs ?? CRAWL_DEFAULTS.rateLimitMs,
      timeoutMs: settings.timeoutMs ?? CRAWL_DEFAULTS.timeoutMs,
    };
    this.onLog = onLog;

    // Normalize starting URL
    let normalized = startUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    this.startUrl = normalized;

    try {
      this.baseHostname = new URL(this.startUrl).hostname.toLowerCase();
    } catch (_) {
      throw new Error(`Invalid URL: ${startUrl}`);
    }
  }

  private isUrlBlacklisted(url: string): boolean {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname + parsed.search;

      // Exclude different hosts
      if (parsed.hostname.toLowerCase() !== this.baseHostname) {
        return true;
      }

      // Check blacklisted terms
      return BLACKLISTED_PATTERNS.some(regex => regex.test(path));
    } catch (_) {
      return true;
    }
  }

  private normalizeUrl(urlStr: string): string {
    try {
      const parsed = new URL(urlStr);
      parsed.hash = ''; // Remove hash
      let result = parsed.toString();
      if (result.endsWith('/')) {
        result = result.slice(0, -1);
      }
      return result;
    } catch (_) {
      return urlStr;
    }
  }

  public async crawl(): Promise<ExtractedPage[]> {
    const normalizedStart = this.normalizeUrl(this.startUrl);
    this.queue.push({ url: normalizedStart, depth: 0 });
    this.visited.add(normalizedStart);

    this.onLog(`[CRAWLER] Starting crawl for ${normalizedStart} (Max Pages: ${this.settings.maxPages}, Max Depth: ${this.settings.maxDepth})`);

    while (this.queue.length > 0 && this.crawledPages.length < this.settings.maxPages) {
      const current = this.queue.shift();
      if (!current) break;

      this.onLog(`[CRAWLER] Progress: ${this.crawledPages.length} pages crawled, ${this.queue.length + 1} remaining in queue`);
      
      const success = await this.crawlPage(current.url, current.depth);
      
      if (success && this.settings.rateLimitMs > 0) {
        await sleep(this.settings.rateLimitMs);
      }
    }

    this.onLog(`[CRAWLER] Crawl completed. Successfully crawled ${this.crawledPages.length} pages.`);
    return this.crawledPages;
  }

  private async crawlPage(url: string, depth: number): Promise<boolean> {
    this.onLog(`[CRAWLER] Fetching: ${url} at depth ${depth}`);
    
    try {
      const response = await axios.get(url, {
        timeout: this.settings.timeoutMs,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AI-Company-Brochure-Generator/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        // Follow redirects and avoid rejecting on SSL errors if possible
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      const contentType = String(response.headers['content-type'] || '');
      if (!contentType.includes('text/html')) {
        this.onLog(`[CRAWLER] Skipping non-HTML page: ${url} (Content-Type: ${contentType})`);
        return false;
      }

      const html = response.data;
      if (!html || typeof html !== 'string') {
        this.onLog(`[CRAWLER] Empty response from: ${url}`);
        return false;
      }

      const parsedPage = extractPageContent(html, url);
      const wordCount = parsedPage.rawText.split(/\s+/).filter(Boolean).length;
      
      this.crawledPages.push(parsedPage);
      this.onLog(`[CRAWLER] Scraped page: "${parsedPage.title}" - ${wordCount} words extracted.`);

      // Discover new links
      if (depth < this.settings.maxDepth) {
        let newLinksCount = 0;
        for (const link of parsedPage.links) {
          const normalizedLink = this.normalizeUrl(link);
          if (!this.visited.has(normalizedLink) && !this.isUrlBlacklisted(normalizedLink)) {
            this.visited.add(normalizedLink);
            this.queue.push({ url: normalizedLink, depth: depth + 1 });
            newLinksCount++;
          }
        }
        if (newLinksCount > 0) {
          this.onLog(`[CRAWLER] Discovered ${newLinksCount} new internal links on page.`);
        }
      }

      return true;
    } catch (error: any) {
      let errorMsg = 'Unknown error';
      if (error.code === 'ECONNABORTED') {
        errorMsg = `Timeout after ${this.settings.timeoutMs}ms`;
      } else if (error.response) {
        errorMsg = `Status code ${error.response.status}`;
      } else if (error.request) {
        errorMsg = 'No response received from host';
      } else {
        errorMsg = error.message || 'Connection failed';
      }

      this.onLog(`[CRAWLER] Error fetching ${url}: ${errorMsg}`);
      return false;
    }
  }
}
