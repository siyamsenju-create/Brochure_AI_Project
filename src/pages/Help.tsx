import React from 'react';
import { HelpCircle, BookOpen, Info, CheckCircle, Terminal, Cpu } from 'lucide-react';

export const Help: React.FC = () => {
  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HelpCircle size={20} />
          <span>Documentation &amp; Support</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Learn how to get the most out of the offline AI Company Brochure Generator.
        </p>
      </div>

      {/* Guide card */}
      <div className="card">
        <h3 className="card-title">
          <BookOpen size={18} />
          <span>How It Works</span>
        </h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          BrochureAI runs a localized three-step pipeline to compile professional marketing reports without cloud dependencies:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>1</div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Target Website Crawl</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                The crawler resolves links on the company's domain, skipping logins, query parameters, shopping carts, and legal notifications to find relevant pages (About, Careers, Products).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>2</div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>DOM Parsing &amp; Extraction</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                We scrape text nodes, header layouts, list formatting, meta tags, and logo files, discarding HTML scripts, stylesheets, sidebars, and navigation footer menus.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>3</div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Local LLM Synthesis</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                The prompt compiler instructs the local Ollama LLM to act as a marketing strategist, writing a structured markdown brochure strictly based on crawled facts with zero hallucinations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ollama Guide */}
      <div className="card">
        <h3 className="card-title">
          <Terminal size={18} />
          <span>Setting up Ollama locally</span>
        </h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          To run brochure generation, ensure the local Ollama daemon is active:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <CheckCircle size={14} className="text-success" />
            <span>1. Download and run Ollama from <a href="https://ollama.com" target="_blank" rel="noreferrer">ollama.com</a>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <CheckCircle size={14} className="text-success" />
            <span>2. Pull a recommended model from your terminal:</span>
          </div>
          <pre 
            style={{ 
              padding: '0.75rem 1rem', 
              backgroundColor: 'var(--bg-input)', 
              borderRadius: 'var(--border-radius-sm)', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.8rem',
              overflowX: 'auto',
              border: '1px solid var(--border-color)'
            }}
          >
            # Fast, lightweight model (Recommended for quick runs)<br />
            ollama run llama3.2<br /><br />
            # Highly accurate larger model (Recommended for maximum brochure detail)<br />
            ollama run llama3.1
          </pre>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <CheckCircle size={14} className="text-success" />
            <span>3. Once running, BrochureAI automatically hooks into the local API on <code>http://localhost:11434</code>.</span>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq-section">
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginTop: '1rem' }}>
          Frequently Asked Questions
        </h3>

        <div className="faq-item">
          <h4 className="faq-question">Why is the Ollama status showing offline?</h4>
          <p className="faq-answer">
            Make sure the Ollama application is opened and running on your system. You can verify it is running by visiting <code>http://localhost:11434</code> in your browser. If you changed the host or port, start BrochureAI with the <code>OLLAMA_URL</code> environment variable configured.
          </p>
        </div>

        <div className="faq-item">
          <h4 className="faq-question">What models are recommended?</h4>
          <p className="faq-answer">
            For fast testing, <strong><code>llama3.2:latest</code></strong> (2.0 GB size) performs extremely quickly. For publication-grade results, <strong><code>llama3.1</code></strong> (8B, 4.7 GB) or <strong><code>phi4</code></strong> have stronger marketing formatting and structured output compliance.
          </p>
        </div>

        <div className="faq-item">
          <h4 className="faq-question">Why does crawling fail on some sites?</h4>
          <p className="faq-answer">
            Some websites utilize Cloudflare or similar DDoS protection filters that block scraper requests. Others are Single Page Applications (SPAs) that compile content entirely via client-side JavaScript. This crawler fetches static HTML to keep runs light, which covers standard company pages.
          </p>
        </div>

        <div className="faq-item">
          <h4 className="faq-question">Does BrochureAI share company data?</h4>
          <p className="faq-answer">
            No. The entire application operates inside your local network. Website crawling, data cleaning, LLM prompting, and document compiling occur on your local machine, keeping sensitive operations confidential.
          </p>
        </div>
      </div>
    </div>
  );
};
