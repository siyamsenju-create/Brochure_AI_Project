import axios from 'axios';
import { OLLAMA_URL } from '../config.js';

export interface OllamaModelDetail {
  name: string;
  size: number;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export async function listOllamaModels(): Promise<OllamaModelDetail[]> {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 3000 });
    if (response.data && Array.isArray(response.data.models)) {
      return response.data.models;
    }
    return [];
  } catch (error) {
    console.warn(`[OLLAMA] Could not connect to Ollama at ${OLLAMA_URL}:`, (error as Error).message);
    return [];
  }
}

export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await axios.get(OLLAMA_URL, { timeout: 2000 });
    return response.status === 200;
  } catch (_) {
    return false;
  }
}

export async function streamOllamaGeneration(
  model: string,
  prompt: string,
  options: { temperature: number; num_ctx: number },
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: any) => void
): Promise<void> {
  try {
    const response = await axios({
      method: 'post',
      url: `${OLLAMA_URL}/api/generate`,
      data: {
        model,
        prompt,
        stream: true,
        options: {
          temperature: options.temperature,
          num_ctx: options.num_ctx,
        },
      },
      responseType: 'stream',
      timeout: 120000, // 2 minutes timeout for LLM generation start
    });

    const stream = response.data;
    let buffer = '';

    stream.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      
      // Save the last line (might be incomplete)
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            onChunk(parsed.response);
          }
          if (parsed.done) {
            onDone();
          }
        } catch (e) {
          console.error('Error parsing Ollama stream line:', line, e);
        }
      }
    });

    stream.on('end', () => {
      // Process remaining buffer
      if (buffer.trim() !== '') {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.response) {
            onChunk(parsed.response);
          }
        } catch (_) {}
      }
      onDone();
    });

    stream.on('error', (err: any) => {
      onError(err);
    });
  } catch (error) {
    onError(error);
  }
}
