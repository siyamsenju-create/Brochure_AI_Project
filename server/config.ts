import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

export const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

export const DEFAULT_MODEL = 'llama3.2';

export const DATA_DIR = path.resolve(__dirname, './data');
export const HISTORY_FILE = path.resolve(DATA_DIR, 'history.json');

export const CRAWL_DEFAULTS = {
  maxPages: 10,
  maxDepth: 2,
  rateLimitMs: 200, // milliseconds between pages
  timeoutMs: 8000,   // timeout per page
};

export const AI_DEFAULTS = {
  temperature: 0.3, // low temperature for high factual accuracy
  num_ctx: 8192,    // context window size
  stream: true,
};
