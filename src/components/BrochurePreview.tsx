import React, { useState } from 'react';
import { Download, ExternalLink, Globe, FileText, CheckCircle, Clock, Layers, HelpCircle } from 'lucide-react';
import { Brochure } from '../utils/api.js';
import { marked } from 'marked';

interface BrochurePreviewProps {
  brochure: Brochure;
  isStreaming?: boolean;
}

export const BrochurePreview: React.FC<BrochurePreviewProps> = ({
  brochure,
  isStreaming = false,
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  // Convert markdown to html using marked library
  const getRenderedHtml = () => {
    try {
      return { __html: marked.parse(brochure.content) };
    } catch (e) {
      return { __html: `<p>${brochure.content}</p>` };
    }
  };

  const handleExport = (format: string) => {
    setDownloading(format);
    // Create an anchor element to trigger the download
    const link = document.createElement('a');
    link.href = `/api/export/${brochure.id}/${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setDownloading(null), 1500);
  };

  const totalWords = brochure.content.split(/\s+/).filter(Boolean).length;
  const cleanedUrl = brochure.website.replace(/^https?:\/\/(www\.)?/, '');

  return (
    <div className="preview-wrapper">
      <div className="preview-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={18} className="text-success" style={{ display: isStreaming ? 'none' : 'block' }} />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
              {isStreaming ? 'Generating Brochure Preview...' : 'Brochure Generated Successfully'}
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Globe size={12} />
              <a href={brochure.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                {cleanedUrl} <ExternalLink size={10} style={{ display: 'inline' }} />
              </a>
            </span>
          </div>
        </div>
        
        {!isStreaming && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-outline" 
              onClick={() => handleExport('md')}
              disabled={downloading !== null}
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
            >
              <Download size={14} />
              <span>{downloading === 'md' ? 'Downloading...' : 'Markdown'}</span>
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => handleExport('html')}
              disabled={downloading !== null}
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
            >
              <Download size={14} />
              <span>{downloading === 'html' ? 'Downloading...' : 'HTML'}</span>
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => handleExport('docx')}
              disabled={downloading !== null}
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
            >
              <FileText size={14} />
              <span>{downloading === 'docx' ? 'Downloading...' : 'Word (.docx)'}</span>
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => handleExport('pdf')}
              disabled={downloading !== null}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              <Download size={14} />
              <span>{downloading === 'pdf' ? 'Downloading...' : 'Export PDF'}</span>
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', borderTop: '1px solid var(--border-color)' }}>
        {/* Rendered Markdown Body */}
        <div className="preview-body">
          <article className="rendered-brochure" dangerouslySetInnerHTML={getRenderedHtml()} />
          {isStreaming && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--primary)' }}>
              <Clock size={16} className="status-dot ping" />
              <span style={{ fontSize: '0.9rem', fontStyle: 'italic', fontWeight: 500 }}>AI is writing sections...</span>
            </div>
          )}
        </div>

        {/* Sidebar Info Panel */}
        <div style={{ borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          <div>
            <h5 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Generation Info
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', justifyContent: 'between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Model:</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{brochure.model}</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <span style={{ fontWeight: 600 }}>{new Date(brochure.date).toLocaleDateString()}</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} />
                  {(brochure.durationMs / 1000).toFixed(1)}s
                </span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Word Count:</span>
                <span style={{ fontWeight: 600 }}>{totalWords}</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Layers size={14} />
              <span>Crawled Pages ({brochure.crawledPages.length})</span>
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
              {brochure.crawledPages.map((page, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: 'var(--border-radius-sm)', 
                    backgroundColor: 'var(--bg-input)', 
                    border: '1px solid var(--border-color)',
                    fontSize: '0.75rem',
                    lineHeight: '1.3'
                  }}
                  title={page.url}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.15rem' }}>
                    {page.title || 'Untitled Page'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {page.url.replace(/^https?:\/\/(www\.)?/, '')}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', justifyContent: 'between' }}>
                    <span>Size:</span>
                    <span>{page.wordCount} words</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
