import React, { useState } from 'react';
import { Sparkles, FileText, Settings, History, Globe, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { Brochure, SystemStatus } from '../utils/api.js';

interface DashboardProps {
  status: SystemStatus | null;
  brochures: Brochure[];
  setView: (view: string) => void;
  setQuickGenerate: (data: { name: string; url: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  status,
  brochures,
  setView,
  setQuickGenerate,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleQuickStart = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !url.trim()) {
      setError('Both Company Name and Website URL are required.');
      return;
    }

    setQuickGenerate({ name: name.trim(), url: url.trim() });
    setView('generate');
  };

  const ollamaOnline = status?.ollamaConnected ?? false;
  const recentBrochures = brochures.slice(0, 3);

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div 
        className="card" 
        style={{ 
          background: 'var(--accent-gradient)', 
          color: 'white', 
          border: 'none', 
          position: 'relative', 
          overflow: 'hidden',
          padding: '2.5rem'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.75rem', lineHeight: '1.2' }}>
            Build Factual Corporate Brochures in Seconds.
          </h1>
          <p style={{ opacity: 0.9, fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Utilize a local crawler and Large Language Model (Ollama) to extract details, structure data, and compile enterprise-grade brochures. 100% offline.
          </p>
          <button 
            className="btn" 
            style={{ backgroundColor: 'white', color: 'var(--primary)', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
            onClick={() => setView('generate')}
          >
            <Sparkles size={16} />
            <span>Launch Generator</span>
          </button>
        </div>
        
        {/* Abstract background glow shapes */}
        <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', filter: 'blur(40px)', zIndex: 1 }} />
      </div>

      {/* Metrics Row */}
      <div className="grid-3">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Brochures Saved</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '0.15rem' }}>{brochures.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}>
            <Settings size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Ollama LLM</div>
            <div 
              style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.35rem', cursor: 'pointer', color: 'var(--primary)' }}
              onClick={() => setView('settings')}
            >
              {status?.defaultModel || 'llama3.2'}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)', backgroundColor: ollamaOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ollamaOnline ? 'var(--success)' : 'var(--danger)' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Ollama API Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
              <span className={`status-dot ${ollamaOnline ? 'ping' : ''}`} style={{ color: ollamaOnline ? 'var(--success)' : 'var(--danger)', width: 6, height: 6 }}></span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: ollamaOnline ? 'var(--success)' : 'var(--danger)' }}>
                {ollamaOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Quick Start Form */}
        <div className="card">
          <h3 className="card-title">
            <Sparkles size={18} className="text-success" />
            <span>Quick Brochure Generator</span>
          </h3>
          <form onSubmit={handleQuickStart}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Tesla" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. https://www.tesla.com" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={!ollamaOnline}>
              <span>Initialize Pipeline</span>
              <ArrowRight size={16} />
            </button>
            
            {!ollamaOnline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.75rem', fontWeight: 500 }}>
                <ShieldCheck size={14} />
                <span>Ollama must be running locally to generate brochures.</span>
              </div>
            )}
          </form>
        </div>

        {/* Recent brochures */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} />
              <span>Recent Generations</span>
            </div>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              onClick={() => setView('history')}
            >
              View All
            </button>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
            {recentBrochures.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '150px' }}>
                <FileText size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <span>No brochures generated yet.</span>
              </div>
            ) : (
              recentBrochures.map((b) => (
                <div 
                  key={b.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'between', 
                    alignItems: 'center', 
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--border-radius-md)', 
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{b.companyName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
                      <span>{new Date(b.date).toLocaleDateString()}</span>
                      <span>&bull;</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{b.model}</span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      setQuickGenerate({ name: b.companyName, url: b.website });
                      // Save active brochure ID on state in parent to open directly in preview
                      // For now, let's open in History page
                      setView('history');
                    }}
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
