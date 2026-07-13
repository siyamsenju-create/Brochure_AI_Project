import * as cheerio from 'cheerio';

export interface ExtractedPage {
  url: string;
  title: string;
  metaDescription: string;
  rawText: string;
  links: string[];
  socialLinks: string[];
  logoUrl?: string;
}

// Check if href is an asset
const ASSET_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.docx', '.xlsx', '.pptx',
  '.zip', '.tar', '.gz', '.mp4', '.mp3', '.css', '.js', '.xml', '.json'
];

export function extractPageContent(html: string, pageUrl: string): ExtractedPage {
  const $ = cheerio.load(html);
  const links: string[] = [];
  const socialLinks: string[] = [];
  let logoUrl: string | undefined = undefined;

  // Resolve base domain for relative link resolving
  let urlObj: URL;
  try {
    urlObj = new URL(pageUrl);
  } catch (e) {
    urlObj = new URL('http://localhost');
  }

  // 1. Extract Logo
  // Check typical meta tags first
  const metaLogo = $('meta[property="og:logo"]').attr('content') || 
                   $('meta[name="twitter:logo"]').attr('content') ||
                   $('link[rel="apple-touch-icon"]').attr('href') ||
                   $('link[rel="icon"]').attr('href');
  
  if (metaLogo) {
    try {
      logoUrl = new URL(metaLogo, pageUrl).toString();
    } catch (_) {}
  }

  // Also check images for logo
  if (!logoUrl) {
    $('img').each((_, elem) => {
      const src = $(elem).attr('src');
      const alt = $(elem).attr('alt') || '';
      const id = $(elem).attr('id') || '';
      const className = $(elem).attr('class') || '';

      if (src && (
        alt.toLowerCase().includes('logo') || 
        id.toLowerCase().includes('logo') || 
        className.toLowerCase().includes('logo') ||
        src.toLowerCase().includes('logo')
      )) {
        try {
          logoUrl = new URL(src, pageUrl).toString();
          return false; // Break loop
        } catch (_) {}
      }
      return true;
    });
  }

  // 2. Extract Meta info
  const title = $('title').text().trim() || urlObj.pathname;
  const metaDescription = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || '';

  // 3. Extract Links & Social Links
  $('a').each((_, elem) => {
    const href = $(elem).attr('href');
    if (!href) return;

    // Filter out email, telephone, javascript links
    const lowerHref = href.toLowerCase().trim();
    if (lowerHref.startsWith('javascript:') || lowerHref.startsWith('mailto:') || lowerHref.startsWith('tel:') || lowerHref.startsWith('#')) {
      return;
    }

    try {
      const resolvedUrl = new URL(href, pageUrl);
      const resolvedStr = resolvedUrl.toString();

      // Check for social links
      const host = resolvedUrl.hostname.toLowerCase();
      if (
        host.includes('linkedin.com') ||
        host.includes('twitter.com') ||
        host.includes('x.com') ||
        host.includes('facebook.com') ||
        host.includes('instagram.com') ||
        host.includes('youtube.com') ||
        host.includes('github.com')
      ) {
        if (!socialLinks.includes(resolvedStr)) {
          socialLinks.push(resolvedStr);
        }
        return;
      }

      // Check if it's an internal link
      if (resolvedUrl.hostname === urlObj.hostname) {
        // Exclude asset downloads
        const pathname = resolvedUrl.pathname.toLowerCase();
        const hasAssetExt = ASSET_EXTENSIONS.some(ext => pathname.endsWith(ext));
        
        if (!hasAssetExt) {
          // Normalize URL: remove hash, remove trailing slash, lower case host
          resolvedUrl.hash = '';
          let normalized = resolvedUrl.toString();
          if (normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
          }
          if (!links.includes(normalized) && normalized !== pageUrl) {
            links.push(normalized);
          }
        }
      }
    } catch (_) {}
  });

  // 4. Clean HTML (remove noisy content)
  const elementsToRemove = [
    'script', 'style', 'noscript', 'iframe', 'header', 'footer', 'nav', 'svg',
    'form', 'select', 'option', 'button', 'dialog', 'aside',
    '.ads', '.cookie-banner', '.cookie-consent', '.footer', '.header', '.nav',
    '#cookie-law-info-bar', '#cookie-consent', '.modal', '.popup',
    '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]'
  ];

  elementsToRemove.forEach(selector => {
    $(selector).remove();
  });

  // Also remove obvious menu-like sections
  $('div, section').each((_, elem) => {
    const className = $(elem).attr('class') || '';
    const id = $(elem).attr('id') || '';
    const lowerClassId = (className + ' ' + id).toLowerCase();
    
    if (
      lowerClassId.includes('menu') || 
      lowerClassId.includes('nav') || 
      lowerClassId.includes('footer') || 
      lowerClassId.includes('cookie') || 
      lowerClassId.includes('popup') || 
      lowerClassId.includes('banner') ||
      lowerClassId.includes('sidebar') ||
      lowerClassId.includes('widget') ||
      lowerClassId.includes('social')
    ) {
      // Don't remove if it contains large amount of text compared to tags,
      // but standard menus have high link/text ratios, let's just detach it if it seems utility-like
      // To be safe, we only remove elements that represent standard overlays, consent bars, or ads
      if (
        lowerClassId.includes('cookie-consent') || 
        lowerClassId.includes('privacy-prompt') || 
        lowerClassId.includes('consent-banner') ||
        lowerClassId.includes('ad-container') ||
        lowerClassId.includes('newsletter-signup')
      ) {
        $(elem).remove();
      }
    }
  });

  // 5. Read clean content
  // We will build a structured textual representation from headings, paragraphs, list items, and table cells.
  let textBlocks: string[] = [];

  // Traverse the remaining elements and extract text from paragraphs, headings, list items
  $('h1, h2, h3, h4, h5, h6, p, li, td, th').each((_, elem) => {
    const tagName = elem.tagName.toLowerCase();
    const text = $(elem).text().trim().replace(/\s+/g, ' ');
    if (!text || text.length < 3) return;

    if (tagName.startsWith('h')) {
      const level = tagName[1];
      const prefix = '#'.repeat(parseInt(level, 10));
      textBlocks.push(`\n${prefix} ${text}\n`);
    } else if (tagName === 'li') {
      textBlocks.push(`* ${text}`);
    } else if (tagName === 'td' || tagName === 'th') {
      // Tables are handled line by line, let's just push text
      textBlocks.push(`| ${text} |`);
    } else {
      textBlocks.push(`\n${text}\n`);
    }
  });

  // Join text and clean up excessive newlines
  const rawText = textBlocks
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    url: pageUrl,
    title,
    metaDescription,
    rawText,
    links,
    socialLinks,
    logoUrl,
  };
}
