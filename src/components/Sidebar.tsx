import React from 'react';
import { LayoutDashboard, FileText, History, Settings, HelpCircle, Sun, Moon, Sparkles } from 'lucide-react';
import { SystemStatus } from '../utils/api.js';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  status: SystemStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  theme,
  toggleTheme,
  status,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate', label: 'Generate Brochure', icon: FileText },
    { id: 'history', label: 'Brochure History', icon: History },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'help', label: 'Documentation & Help', icon: HelpCircle },
  ];

  const ollamaOnline = status?.ollamaConnected ?? false;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Sparkles size={18} />
        </div>
        <span className="sidebar-title">BrochureAI</span>
      </div>

      <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li
                key={item.id}
                className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
              >
                <button onClick={() => setView(item.id)}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {/* Status indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Ollama:</span>
            <div className={`status-badge ${ollamaOnline ? 'online' : 'offline'}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
              <span className={`status-dot ${ollamaOnline ? 'ping' : ''}`}></span>
              <span>{ollamaOnline ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          {ollamaOnline && status?.defaultModel && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Model: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{status.defaultModel}</span>
            </div>
          )}
        </div>

        {/* Theme Toggler */}
        <div className="theme-toggle" style={{ width: '100%' }}>
          <button
            className={theme === 'light' ? 'active' : ''}
            onClick={() => theme !== 'light' && toggleTheme()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Sun size={14} />
            <span>Light</span>
          </button>
          <button
            className={theme === 'dark' ? 'active' : ''}
            onClick={() => theme !== 'dark' && toggleTheme()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Moon size={14} />
            <span>Dark</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
