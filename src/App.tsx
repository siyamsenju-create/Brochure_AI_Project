import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Generate } from './pages/Generate.jsx';
import { History } from './pages/History.jsx';
import { Settings } from './pages/Settings.jsx';
import { Help } from './pages/Help.jsx';
import { getSystemStatus, getHistory, Brochure, SystemStatus } from './utils/api.js';

interface SettingsData {
  model: string;
  maxPages: number;
  maxDepth: number;
  temperature: number;
  contextWindow: number;
  stream: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  model: 'llama3.2',
  maxPages: 10,
  maxDepth: 2,
  temperature: 0.3,
  contextWindow: 8192,
  stream: true,
};

export default function App() {
  const [currentView, setView] = useState<string>('dashboard');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [brochures, setBrochures] = useState<Brochure[]>([]);
  const [quickGenerate, setQuickGenerate] = useState<{ name: string; url: string } | null>(null);

  // Load theme from localStorage or system preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('brochure_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Load settings from localStorage
  const [settings, setSettings] = useState<SettingsData>(() => {
    const saved = localStorage.getItem('brochure_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (_) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Apply theme attributes to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('brochure_theme', theme);
  }, [theme]);

  // Fetch status and history on load
  const fetchStatusAndHistory = async () => {
    try {
      const systemStatus = await getSystemStatus();
      setStatus(systemStatus);
      
      // Update default model in settings if we have models list and default settings model hasn't been modified
      if (systemStatus.defaultModel && !localStorage.getItem('brochure_settings')) {
        setSettings(prev => ({ ...prev, model: systemStatus.defaultModel }));
      }
    } catch (err) {
      console.warn('Could not connect to backend server on status check:', err);
      setStatus(prev => prev ? { ...prev, ollamaConnected: false } : { status: 'offline', ollamaConnected: false, defaultModel: '' });
    }

    try {
      const historyList = await getHistory();
      setBrochures(historyList);
    } catch (err) {
      console.error('Could not fetch history list:', err);
    }
  };

  useEffect(() => {
    fetchStatusAndHistory();

    // Poll status check every 10 seconds
    const interval = setInterval(() => {
      getSystemStatus()
        .then(setStatus)
        .catch(() => setStatus(prev => prev ? { ...prev, ollamaConnected: false } : { status: 'offline', ollamaConnected: false, defaultModel: '' }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (newSettings: SettingsData) => {
    setSettings(newSettings);
    localStorage.setItem('brochure_settings', JSON.stringify(newSettings));
    
    // Propagate default model update to backend if possible (optional, backend resolves defaults dynamically)
    fetchStatusAndHistory();
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getPageHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard Hub';
      case 'generate': return 'Configure & Generate';
      case 'history': return 'Saved Brochures';
      case 'settings': return 'System Settings';
      case 'help': return 'User Documentation';
      default: return 'BrochureAI';
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        setView={setView}
        theme={theme}
        toggleTheme={toggleTheme}
        status={status}
      />

      <main className="main-content">
        <header className="header">
          <div className="header-title-section">
            <h2>{getPageHeaderTitle()}</h2>
          </div>
          <div className="header-actions">
            <div className="status-badge online" style={{ padding: '4px 12px' }}>
              <span className="status-dot"></span>
              <span>Local Pipeline Connected</span>
            </div>
          </div>
        </header>

        {/* View Router */}
        {currentView === 'dashboard' && (
          <Dashboard
            status={status}
            brochures={brochures}
            setView={setView}
            setQuickGenerate={setQuickGenerate}
          />
        )}
        
        {currentView === 'generate' && (
          <Generate
            quickGenerateData={quickGenerate}
            clearQuickGenerate={() => setQuickGenerate(null)}
            onGenerationSuccess={fetchStatusAndHistory}
          />
        )}

        {currentView === 'history' && (
          <History
            brochures={brochures}
            refreshHistory={fetchStatusAndHistory}
            setView={setView}
            setQuickGenerate={setQuickGenerate}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            settings={settings}
            saveSettings={handleSaveSettings}
          />
        )}

        {currentView === 'help' && (
          <Help />
        )}
      </main>
    </div>
  );
}
