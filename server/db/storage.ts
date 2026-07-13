import fs from 'fs';
import path from 'path';
import { HISTORY_FILE, DATA_DIR } from '../config.js';

export interface CrawledPageInfo {
  url: string;
  title: string;
  wordCount: number;
}

export interface Brochure {
  id: string;
  companyName: string;
  website: string;
  date: string;
  model: string;
  content: string;
  crawledPages: CrawledPageInfo[];
  settings: {
    maxPages: number;
    maxDepth: number;
    temperature: number;
    contextWindow: number;
  };
  durationMs: number;
}

// Ensure the data directory and history file exist
function initStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getBrochures(): Brochure[] {
  try {
    initStorage();
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const brochures: Brochure[] = JSON.parse(data);
    // Sort by date descending
    return brochures.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error reading brochures history:', error);
    return [];
  }
}

export function getBrochureById(id: string): Brochure | undefined {
  const brochures = getBrochures();
  return brochures.find(b => b.id === id);
}

export function saveBrochure(
  brochureData: Omit<Brochure, 'id' | 'date'> & { id?: string; date?: string }
): Brochure {
  initStorage();
  const brochures = getBrochures();
  
  const id = brochureData.id || Math.random().toString(36).substring(2, 15);
  const date = brochureData.date || new Date().toISOString();
  
  const newBrochure: Brochure = {
    ...brochureData,
    id,
    date,
  };
  
  const index = brochures.findIndex(b => b.id === id);
  if (index !== -1) {
    // Update existing
    brochures[index] = newBrochure;
  } else {
    // Add new
    brochures.push(newBrochure);
  }
  
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(brochures, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing brochures history:', error);
  }
  
  return newBrochure;
}

export function deleteBrochure(id: string): boolean {
  initStorage();
  const brochures = getBrochures();
  const filtered = brochures.filter(b => b.id !== id);
  
  if (filtered.length === brochures.length) {
    return false; // not found
  }
  
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing brochures history after deletion:', error);
    return false;
  }
}
