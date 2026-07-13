import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Info, Sliders, ShieldAlert, Cpu } from 'lucide-react';
import { getOllamaModels, OllamaModel } from '../utils/api.js';

interface SettingsData {
  model: string;
  maxPages: number;
  maxDepth: number;
  temperature: number;
  contextWindow: number;
  stream: boolean;
}

interface SettingsProps {
  settings: SettingsData;
  saveSettings: (settings: SettingsData) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, saveSettings }) => {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [model, setModel] = useState(settings.model);
  const [maxPages, setMaxPages] = useState(settings.maxPages);
  const [maxDepth, setMaxDepth] = useState(settings.maxDepth);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [contextWindow, setContextWindow] = useState(settings.contextWindow);
  const [stream, setStream] = useState(settings.stream);
  
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOllamaModels()
      .then((data) => {
        setModels(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching models in settings page:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings({
      model,
      maxPages,
      maxDepth,
      temperature,
      contextWindow,
      stream,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={20} />
          <span>System Settings</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure default values for Ollama LLM execution, crawling boundaries, and pipeline options.
        </p>
      </div>

      <form onSubmit={handleSave} className="settings-list">
        {/* Model Configuration */}
        <div className="card">
          <h3 className="card-title">
            <Cpu size={18} />
            <span>Ollama Model Configuration</span>
          </h3>
          
          <div className="form-group">
            <label className="form-label">Default LLM Model</label>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading models from local Ollama instance...</div>
            ) : (
              <select 
                className="form-select" 
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {models.length === 0 ? (
                  <option value="llama3.2">llama3.2 (No connection detected)</option>
                ) : (
                  models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.details.parameter_size || 'Unknown parameters'})
                    </option>
                  ))
                )}
              </select>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Info size={12} />
              <span>Only models downloaded through Ollama (e.g. <code>ollama run llama3.2</code>) appear in this list.</span>
            </span>
          </div>
        </div>

        {/* Crawler Boundaries */}
        <div className="card">
          <h3 className="card-title">
            <Sliders size={18} />
            <span>Web Crawler Constraints</span>
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Crawl Page Limit (Max {maxPages} pages)</label>
              <div className="slider-group">
                <input 
                  type="range" 
                  min={2} 
                  max={30} 
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value, 10))}
                />
                <span className="slider-value">{maxPages}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Crawl Depth Level (Depth {maxDepth})</label>
              <select 
                className="form-select"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
              >
                <option value={1}>1 - Target Domain Homepage Only</option>
                <option value={2}>2 - Homepage + Sublinks (Recommended)</option>
                <option value={3}>3 - Deep crawling (Caution: slower)</option>
              </select>
            </div>
          </div>
        </div>

        {/* LLM Parameters */}
        <div className="card">
          <h3 className="card-title">
            <Sliders size={18} />
            <span>Model Execution Parameters</span>
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">LLM Temperature ({temperature.toFixed(1)})</label>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Lower temperatures (0.1 - 0.3) force factual compliance. Higher values increase creative styling.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Context Window (Tokens: {contextWindow})</label>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Raise this if generating brochures for content-heavy sites to avoid truncation.
              </span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem', marginBottom: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="stream-toggle"
              checked={stream} 
              onChange={(e) => setStream(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="stream-toggle" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
              Enable Streaming Responses (SSE)
            </label>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
          <div>
            {saved && (
              <span className="text-success" style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Save size={16} />
                <span>Settings saved to local storage!</span>
              </span>
            )}
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
