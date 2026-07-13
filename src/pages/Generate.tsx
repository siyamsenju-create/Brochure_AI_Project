import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Settings2, Globe, Cpu, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { generateBrochureStream, getOllamaModels, OllamaModel, Brochure } from '../utils/api.js';
import { ConsoleLogs, LogEntry } from '../components/ConsoleLogs.js';
import { BrochurePreview } from '../components/BrochurePreview.js';
import confetti from 'canvas-confetti';

interface GenerateProps {
  quickGenerateData: { name: string; url: string } | null;
  clearQuickGenerate: () => void;
  onGenerationSuccess: () => void; // Trigger history refresh in parent
}

export const Generate: React.FC<GenerateProps> = ({
  quickGenerateData,
  clearQuickGenerate,
  onGenerationSuccess,
}) => {
  // Form inputs
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  
  // Advanced Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [maxPages, setMaxPages] = useState(10);
  const [maxDepth, setMaxDepth] = useState(2);
  const [temperature, setTemperature] = useState(0.3);
  const [contextWindow, setContextWindow] = useState(8192);

  // Pipeline execution state
  // 'idle' | 'crawling' | 'ai_writing' | 'completed' | 'error'
  const [phase, setPhase] = useState<'idle' | 'crawling' | 'ai_writing' | 'completed' | 'error'>('idle');
  const [crawlingProgress, setCrawlingProgress] = useState({ current: '', count: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [streamedText, setStreamedText] = useState('');
  const [finalBrochure, setFinalBrochure] = useState<Brochure | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Ollama models on mount
  useEffect(() => {
    getOllamaModels()
      .then((data) => {
        setModels(data);
        if (data.length > 0) {
          // If llama3.2 is available, use it, else pick the first model
          const hasDefault = data.some(m => m.name.startsWith('llama3.2'));
          if (!hasDefault) {
            setSelectedModel(data[0].name);
          }
        }
      })
      .catch((err) => console.error('Error fetching models in generate page:', err));
  }, []);

  // Handle Quick Start triggers from dashboard
  useEffect(() => {
    if (quickGenerateData) {
      setName(quickGenerateData.name);
      setUrl(quickGenerateData.url);
      clearQuickGenerate();
      
      // Auto-trigger generation after states settle
      setTimeout(() => {
        triggerGeneration(quickGenerateData.name, quickGenerateData.url);
      }, 100);
    }
  }, [quickGenerateData]);

  const addLog = (message: string, source: 'crawler' | 'ai' | 'system' | 'error') => {
    setLogs((prev) => [...prev, { message, source, timestamp: new Date() }]);
  };

  const triggerGeneration = (compName: string, compUrl: string) => {
    if (!compName.trim() || !compUrl.trim()) return;

    // Reset pipeline state
    setPhase('crawling');
    setLogs([]);
    setStreamedText('');
    setFinalBrochure(null);
    setErrorMsg('');
    setCrawlingProgress({ current: '', count: 0 });

    addLog(`[SYSTEM] Starting pipeline for ${compName} (${compUrl})`, 'system');

    generateBrochureStream(
      compName.trim(),
      compUrl.trim(),
      {
        model: selectedModel,
        maxPages,
        maxDepth,
        temperature,
        contextWindow,
      },
      {
        onLog: (log) => {
          addLog(log.message, log.source as any);

          // Update progress indicator based on crawler logs
          if (log.message.includes('[CRAWLER] Scraped page:')) {
            setCrawlingProgress((prev) => ({
              ...prev,
              count: prev.count + 1,
            }));
          }
          if (log.message.includes('[CRAWLER] Fetching:')) {
            const match = log.message.match(/Fetching: (https?:\/\/\S+)/);
            if (match) {
              setCrawlingProgress((prev) => ({
                ...prev,
                current: match[1],
              }));
            }
          }
        },
        onChunk: (chunk) => {
          setPhase('ai_writing');
          setStreamedText((prev) => prev + chunk);
        },
        onDone: (brochure) => {
          setPhase('completed');
          setFinalBrochure(brochure);
          onGenerationSuccess(); // Refresh history list in parent

          // Trigger fireworks confetti!
          const duration = 3 * 1000;
          const end = Date.now() + duration;

          (function frame() {
            confetti({
              particleCount: 3,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#4f46e5', '#6366f1', '#a855f7']
            });
            confetti({
              particleCount: 3,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#4f46e5', '#6366f1', '#a855f7']
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());
        },
        onError: (err) => {
          setPhase('error');
          setErrorMsg(err);
          addLog(`[ERROR] Generation failed: ${err}`, 'error');
        },
      }
    );
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    triggerGeneration(name, url);
  };

  const handleReset = () => {
    setPhase('idle');
    setLogs([]);
    setStreamedText('');
    setFinalBrochure(null);
    setErrorMsg('');
  };

  // Estimate completion helper
  const getProgressPercent = () => {
    if (phase === 'idle') return 0;
    if (phase === 'crawling') {
      // Crawling is 0-40% of the bar
      return Math.min(10 + (crawlingProgress.count / maxPages) * 30, 40);
    }
    if (phase === 'ai_writing') {
      // AI writing is 40-95%
      const words = streamedText.split(/\s+/).length;
      return Math.min(40 + (words / 600) * 55, 95);
    }
    if (phase === 'completed') return 100;
    return 0;
  };

  return (
    <div className="page-container">
      {phase === 'idle' ? (
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} className="text-success" />
            <span>Generate New Brochure</span>
          </h2>
          
          <form onSubmit={handleStart}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Tesla" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Website URL</label>
              <input 
                type="url" 
                className="form-input" 
                placeholder="e.g. https://www.tesla.com" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings2 size={14} />
              <span>{showAdvanced ? 'Hide Advanced Settings' : 'Configure Advanced Settings'}</span>
            </button>

            {showAdvanced && (
              <div 
                style={{ 
                  padding: '1.25rem', 
                  borderRadius: 'var(--border-radius-md)', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--bg-input)', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Cpu size={12} />
                      <span>Ollama Model</span>
                    </label>
                    <select 
                      className="form-select" 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      {models.length === 0 ? (
                        <option value="llama3.2">llama3.2 (Fallback)</option>
                      ) : (
                        models.map((m) => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Globe size={12} />
                      <span>Crawl Depth Limit</span>
                    </label>
                    <select 
                      className="form-select" 
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
                    >
                      <option value={1}>1 (Homepage only)</option>
                      <option value={2}>2 (Standard Subpages)</option>
                      <option value={3}>3 (Deep crawl - slower)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Max Pages to Scrape</label>
                    <div className="slider-group">
                      <input 
                        type="range" 
                        min={2} 
                        max={25} 
                        value={maxPages}
                        onChange={(e) => setMaxPages(parseInt(e.target.value, 10))}
                      />
                      <span className="slider-value">{maxPages}</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">LLM Temperature</label>
                    <div className="slider-group">
                      <input 
                        type="range" 
                        min={0} 
                        max={10} 
                        step={1}
                        value={temperature * 10}
                        onChange={(e) => setTemperature(parseInt(e.target.value, 10) / 10)}
                      />
                      <span className="slider-value">{temperature.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Context Window (Tokens)</label>
                  <div className="slider-group">
                    <input 
                      type="range" 
                      min={2048} 
                      max={32768} 
                      step={2048}
                      value={contextWindow}
                      onChange={(e) => setContextWindow(parseInt(e.target.value, 10))}
                    />
                    <span className="slider-value" style={{ width: '60px' }}>{contextWindow}</span>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              <span>Initialize Brochure Generation</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Status Display Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
                  {phase === 'crawling' && 'Crawling & Scraping Company Website...'}
                  {phase === 'ai_writing' && 'AI Model Generating Brochure Text...'}
                  {phase === 'completed' && 'Brochure Successfully Generated!'}
                  {phase === 'error' && 'Pipeline Failed'}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Target: <strong>{name}</strong> &bull; {url}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(phase === 'completed' || phase === 'error') && (
                  <button className="btn btn-secondary" onClick={handleReset}>
                    <span>Create Another</span>
                  </button>
                )}
                {phase === 'error' && (
                  <button className="btn btn-primary" onClick={() => triggerGeneration(name, url)}>
                    <RefreshCw size={14} />
                    <span>Retry Pipeline</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                <span>
                  {phase === 'crawling' && `Crawling page: ${crawlingProgress.count} found...`}
                  {phase === 'ai_writing' && `AI streaming brochure sections...`}
                  {phase === 'completed' && `Completed!`}
                  {phase === 'error' && `Error encountered`}
                </span>
                <span>{Math.round(getProgressPercent())}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar-fill ${phase === 'crawling' || phase === 'ai_writing' ? 'shimmer' : ''}`}
                  style={{ width: `${getProgressPercent()}%`, backgroundColor: phase === 'error' ? 'var(--danger)' : '' }}
                />
              </div>
            </div>

            {/* Mini crawling info */}
            {phase === 'crawling' && crawlingProgress.current && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                Currently scraping: {crawlingProgress.current}
              </div>
            )}
          </div>

          {/* Grid Layout: Logs & Live Stream Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: phase === 'completed' ? '1fr' : '400px 1fr', gap: '1.5rem' }}>
            
            {/* Show logs unless completed */}
            {phase !== 'completed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ConsoleLogs logs={logs} />
                
                {phase === 'error' && (
                  <div 
                    className="card" 
                    style={{ 
                      borderColor: 'var(--danger)', 
                      backgroundColor: 'rgba(239, 68, 68, 0.05)', 
                      color: 'var(--text-primary)',
                      display: 'flex',
                      gap: '0.75rem'
                    }}
                  >
                    <AlertTriangle size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>Pipeline Failure</h4>
                      <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>{errorMsg}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show Preview */}
            {(phase === 'ai_writing' || phase === 'completed') && (
              <div>
                {finalBrochure ? (
                  <BrochurePreview brochure={finalBrochure} />
                ) : (
                  // Mock brochure object for streaming preview
                  <BrochurePreview 
                    isStreaming={true}
                    brochure={{
                      id: 'streaming',
                      companyName: name,
                      website: url,
                      date: new Date().toISOString(),
                      model: selectedModel,
                      content: streamedText,
                      crawledPages: [],
                      settings: { maxPages, maxDepth, temperature, contextWindow },
                      durationMs: 0,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
