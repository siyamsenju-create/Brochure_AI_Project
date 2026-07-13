export interface Brochure {
  id: string;
  companyName: string;
  website: string;
  date: string;
  model: string;
  content: string;
  crawledPages: {
    url: string;
    title: string;
    wordCount: number;
  }[];
  settings: {
    maxPages: number;
    maxDepth: number;
    temperature: number;
    contextWindow: number;
  };
  durationMs: number;
}

export interface SystemStatus {
  status: string;
  ollamaConnected: boolean;
  defaultModel: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  details: {
    parameter_size: string;
    quantization_level: string;
    family: string;
  };
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function getOllamaModels(): Promise<OllamaModel[]> {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error('Failed to fetch Ollama models');
  const data = await res.json();
  return data.models || [];
}

export async function getHistory(): Promise<Brochure[]> {
  const res = await fetch('/api/history');
  if (!res.ok) throw new Error('Failed to fetch history');
  const data = await res.json();
  return data.brochures || [];
}

export async function deleteBrochure(id: string): Promise<void> {
  const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete brochure');
}

export interface StreamCallbacks {
  onLog: (log: { message: string; source: string }) => void;
  onChunk: (chunk: string) => void;
  onDone: (brochure: Brochure) => void;
  onError: (errorMsg: string) => void;
}

export async function generateBrochureStream(
  companyName: string,
  website: string,
  settings: {
    model?: string;
    maxPages?: number;
    maxDepth?: number;
    temperature?: number;
    contextWindow?: number;
  },
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyName, website, settings }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Readable stream not supported in this browser');
    }

    const decoder = new TextDecoder();
    let partialLine = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunkStr = decoder.decode(value, { stream: true });
      const lines = (partialLine + chunkStr).split('\n');
      partialLine = lines.pop() || ''; // Last line might be incomplete

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const parsed = JSON.parse(trimmed.slice(6));
          
          if (parsed.type === 'log') {
            callbacks.onLog({ message: parsed.message, source: parsed.source });
          } else if (parsed.type === 'chunk') {
            callbacks.onChunk(parsed.text);
          } else if (parsed.type === 'done') {
            callbacks.onDone(parsed.brochure);
          } else if (parsed.type === 'error') {
            callbacks.onError(parsed.message);
          }
        } catch (e) {
          console.error('Error parsing SSE event data:', trimmed, e);
        }
      }
    }
  } catch (error: any) {
    callbacks.onError(error.message || 'Network error occurred during generation');
  }
}
