import express from 'express';
import cors from 'cors';
import { PORT, DEFAULT_MODEL, CRAWL_DEFAULTS, AI_DEFAULTS } from './config.js';
import { getBrochures, getBrochureById, saveBrochure, deleteBrochure } from './db/storage.js';
import { WebCrawler } from './crawler/crawler.js';
import { buildBrochurePrompt } from './ai/prompt.js';
import { streamOllamaGeneration, listOllamaModels, checkOllamaStatus } from './ai/ollama.js';
import { exportToHtml, exportToPdf, exportToDocx } from './export/exporter.js';

const app = express();

app.use(cors());
app.use(express.json());

// Server Status check
app.get('/api/status', async (req, res) => {
  const ollamaConnected = await checkOllamaStatus();
  res.json({
    status: 'ok',
    ollamaConnected,
    defaultModel: DEFAULT_MODEL,
  });
});

// List Ollama models
app.get('/api/models', async (req, res) => {
  const models = await listOllamaModels();
  res.json({ models });
});

// List brochure history
app.get('/api/history', (req, res) => {
  try {
    const brochures = getBrochures();
    res.json({ brochures });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read history' });
  }
});

// Delete brochure from history
app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  const success = deleteBrochure(id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Brochure not found' });
  }
});

// Generate brochure endpoint using SSE (Server-Sent Events)
app.post('/api/generate', async (req, res) => {
  const { companyName, website, settings = {} } = req.body;

  if (!companyName || !website) {
    res.status(400).json({ error: 'Company Name and Website URL are required' });
    return;
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const sendEvent = (type: string, data: any) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  const startTime = Date.now();
  const maxPages = settings.maxPages ?? CRAWL_DEFAULTS.maxPages;
  const maxDepth = settings.maxDepth ?? CRAWL_DEFAULTS.maxDepth;
  const temperature = settings.temperature ?? AI_DEFAULTS.temperature;
  const contextWindow = settings.contextWindow ?? AI_DEFAULTS.num_ctx;
  const model = settings.model ?? DEFAULT_MODEL;

  sendEvent('log', { message: `[SYSTEM] Initiating generation flow for "${companyName}"...`, source: 'system' });

  try {
    // 1. Run Crawler
    const crawler = new WebCrawler(
      website,
      {
        maxPages,
        maxDepth,
        rateLimitMs: CRAWL_DEFAULTS.rateLimitMs,
        timeoutMs: CRAWL_DEFAULTS.timeoutMs,
      },
      (msg) => {
        sendEvent('log', { message: msg, source: 'crawler' });
      }
    );

    const pages = await crawler.crawl();

    if (pages.length === 0) {
      sendEvent('error', { message: 'Failed to extract any content from the website. Please check the URL and try again.' });
      res.end();
      return;
    }

    // 2. Build Prompt
    sendEvent('log', { message: '[SYSTEM] Extracting and structuring website text content...', source: 'system' });
    const prompt = buildBrochurePrompt(companyName, website, pages);
    
    // 3. Contact LLM & Stream output
    sendEvent('log', { message: `[SYSTEM] Initializing Ollama stream using model "${model}"...`, source: 'system' });
    sendEvent('log', { message: `[AI] Prompt size: ~${Math.round(prompt.length / 4)} tokens. Context Window: ${contextWindow}. Temp: ${temperature}`, source: 'system' });

    let fullContent = '';

    await streamOllamaGeneration(
      model,
      prompt,
      { temperature, num_ctx: contextWindow },
      (chunk) => {
        fullContent += chunk;
        sendEvent('chunk', { text: chunk });
      },
      () => {
        // AI Done. Save history
        const durationMs = Date.now() - startTime;
        sendEvent('log', { message: `[SYSTEM] Brochure generation complete in ${(durationMs / 1000).toFixed(1)}s! Saving file...`, source: 'system' });

        const crawledPagesInfo = pages.map(p => ({
          url: p.url,
          title: p.title,
          wordCount: p.rawText.split(/\s+/).filter(Boolean).length
        }));

        const savedBrochure = saveBrochure({
          companyName,
          website,
          model,
          content: fullContent,
          crawledPages: crawledPagesInfo,
          settings: {
            maxPages,
            maxDepth,
            temperature,
            contextWindow,
          },
          durationMs,
        });

        sendEvent('done', { brochure: savedBrochure });
        res.end();
      },
      (error) => {
        console.error('Ollama stream error:', error);
        sendEvent('error', { 
          message: `Ollama connection error. Ensure Ollama is running and model "${model}" is downloaded. Details: ${error.message || error}` 
        });
        res.end();
      }
    );

  } catch (error: any) {
    console.error('General generate error:', error);
    sendEvent('error', { message: error.message || 'An unexpected error occurred during generation' });
    res.end();
  }
});

// File Exporters
app.get('/api/export/:id/:format', async (req, res) => {
  const { id, format } = req.params;
  const brochure = getBrochureById(id);

  if (!brochure) {
    res.status(404).json({ error: 'Brochure not found' });
    return;
  }

  const safeCompanyName = brochure.companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  try {
    switch (format.toLowerCase()) {
      case 'md':
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeCompanyName}_brochure.md"`);
        res.send(brochure.content);
        return;

      case 'html':
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeCompanyName}_brochure.html"`);
        res.send(exportToHtml(brochure));
        return;

      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeCompanyName}_brochure.pdf"`);
        exportToPdf(brochure, res);
        return; // pdfkit handles sending via stream pipe

      case 'docx':
        const docxBuffer = await exportToDocx(brochure);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${safeCompanyName}_brochure.docx"`);
        res.send(docxBuffer);
        return;

      default:
        res.status(400).json({ error: 'Unsupported format. Use md, html, pdf, or docx.' });
        return;
    }
  } catch (error: any) {
    console.error(`Export failed for format ${format}:`, error);
    res.status(500).json({ error: `Export failed: ${error.message}` });
    return;
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`[SERVER] Backend server running on http://localhost:${PORT}`);
});
