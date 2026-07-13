import React, { useEffect, useRef } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export interface LogEntry {
  message: string;
  source: 'crawler' | 'ai' | 'system' | 'error';
  timestamp: Date;
}

interface ConsoleLogsProps {
  logs: LogEntry[];
  onClear?: () => void;
}

export const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs, onClear }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  const copyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp.toLocaleTimeString()}] [${l.source.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="console-container">
      <div className="console-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={14} />
          <span>Active Pipeline Console Logs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {logs.length > 0 && (
            <button
              onClick={copyLogs}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.7rem',
              }}
              title="Copy terminal logs"
            >
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
          {onClear && logs.length > 0 && (
            <button
              onClick={onClear}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '0.7rem',
              }}
            >
              Clear
            </button>
          )}
          <div className="console-dots">
            <span className="console-dot red"></span>
            <span className="console-dot yellow"></span>
            <span className="console-dot green"></span>
          </div>
        </div>
      </div>
      <div className="console-body" ref={bodyRef}>
        {logs.length === 0 ? (
          <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', marginTop: '4rem' }}>
            Console idle. Enter company details above and start generation.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-line ${log.source}`}>
              <span style={{ color: '#64748b', marginRight: '0.5rem' }}>
                [{log.timestamp.toLocaleTimeString()}]
              </span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
