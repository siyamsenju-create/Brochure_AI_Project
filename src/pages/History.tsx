import React, { useState } from 'react';
import { History as HistoryIcon, Search, Eye, Trash2, ArrowLeft, Download, RefreshCw, FileText, Calendar } from 'lucide-react';
import { Brochure, deleteBrochure } from '../utils/api.js';
import { BrochurePreview } from '../components/BrochurePreview.js';

interface HistoryProps {
  brochures: Brochure[];
  refreshHistory: () => void;
  setView: (view: string) => void;
  setQuickGenerate: (data: { name: string; url: string }) => void;
}

export const History: React.FC<HistoryProps> = ({
  brochures,
  refreshHistory,
  setView,
  setQuickGenerate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrochure, setSelectedBrochure] = useState<Brochure | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this brochure from history?')) return;
    
    setDeletingId(id);
    try {
      await deleteBrochure(id);
      refreshHistory();
      if (selectedBrochure?.id === id) {
        setSelectedBrochure(null);
      }
    } catch (err) {
      alert('Failed to delete brochure');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegenerate = (b: Brochure, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickGenerate({ name: b.companyName, url: b.website });
    setView('generate');
  };

  const filteredBrochures = brochures.filter((b) =>
    b.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.website.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedBrochure) {
    return (
      <div className="page-container">
        <div>
          <button 
            className="btn btn-outline" 
            onClick={() => setSelectedBrochure(null)}
            style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ArrowLeft size={16} />
            <span>Back to History List</span>
          </button>
          
          <BrochurePreview brochure={selectedBrochure} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HistoryIcon size={20} />
            <span>Saved Brochure Archive</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Browse, preview, and download previously compiled business brochures.
          </p>
        </div>

        {/* Search */}
        {brochures.length > 0 && (
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by company name or URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* History List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {brochures.length === 0 ? (
          <div className="empty-state">
            <HistoryIcon size={48} />
            <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>History Archive Empty</h3>
            <p style={{ maxWidth: '350px', fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 auto 0.5rem auto' }}>
              No brochures have been generated yet. Head over to the generator to create your first report.
            </p>
            <button className="btn btn-primary" onClick={() => setView('generate')}>
              <span>Compile First Brochure</span>
            </button>
          </div>
        ) : filteredBrochures.length === 0 ? (
          <div className="empty-state">
            <Search size={48} />
            <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>No Matches Found</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              No brochures match your search query: "{searchTerm}"
            </p>
          </div>
        ) : (
          filteredBrochures.map((b) => (
            <div 
              key={b.id} 
              className="history-item"
              onClick={() => setSelectedBrochure(b)}
              style={{ cursor: 'pointer' }}
            >
              <div className="history-item-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="history-item-title">{b.companyName}</span>
                  <a 
                    href={b.website} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={(e) => e.stopPropagation()} 
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.15rem', color: 'var(--text-muted)' }}
                  >
                    <span>{b.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                  </a>
                </div>
                
                <div className="history-item-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} />
                    {new Date(b.date).toLocaleDateString()}
                  </span>
                  <span>&bull;</span>
                  <span>Model: <strong>{b.model}</strong></span>
                  <span>&bull;</span>
                  <span>Pages Crawled: {b.crawledPages.length}</span>
                  <span>&bull;</span>
                  <span>Words: {b.content.split(/\s+/).filter(Boolean).length}</span>
                </div>
              </div>

              <div className="history-item-actions" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.5rem' }} 
                  title="View Brochure"
                  onClick={() => setSelectedBrochure(b)}
                >
                  <Eye size={14} />
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.5rem' }} 
                  title="Regenerate"
                  onClick={(e) => handleRegenerate(b, e)}
                >
                  <RefreshCw size={14} />
                </button>
                
                {/* Quick Exporters */}
                <a 
                  href={`/api/export/${b.id}/pdf`}
                  download
                  className="btn btn-outline" 
                  style={{ padding: '0.5rem', color: 'var(--primary)' }} 
                  title="Download PDF"
                >
                  <Download size={14} />
                </a>

                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.5rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }} 
                  title="Delete brochure"
                  disabled={deletingId === b.id}
                  onClick={(e) => handleDelete(b.id, e)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
