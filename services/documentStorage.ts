import { View } from '../types';

export interface WordDocument {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface ExcelDocument {
  id: string;
  title: string;
  grid: Array<Array<{ value: string; formula: string }>>;
  updatedAt: number;
}

export interface PythonDocument {
  id: string;
  title: string;
  code: string;
  updatedAt: number;
}

export interface SearchResult {
  id: string;
  type: 'word' | 'excel' | 'python';
  title: string;
  snippet: string;
  score: number;
  updatedAt: number;
}

export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
  source: 'word' | 'excel' | 'chat';
  pinned?: boolean;
}

const WORD_DOCS_KEY = 'quantinum_word_docs';
const EXCEL_DOCS_KEY = 'quantinum_excel_docs';
const PYTHON_DOCS_KEY = 'quantinum_python_docs';
const CLIPBOARD_KEY = 'quantinum_clipboard_items';

// INITIAL SEED DATA
const DEFAULT_PYTHON_DOCS: PythonDocument[] = [
  {
    id: 'python-neural-net',
    title: 'Neural Net Lab',
    code: `# Welcome to Cosmic Python\nimport sys\n\nprint("Hello from QUANTINUM-Q!")\nprint(f"Python version: {sys.version}")\n\n# Try some math\ndef fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)\n\nprint(f"Fibonacci sequence (first 10): {[fib(i) for i in range(10)]}")`,
    updatedAt: Date.now() - 3600000 * 2
  }
];

const DEFAULT_WORD_DOCS: WordDocument[] = [
  {
    id: 'word-draft-1',
    title: 'Quantum Draft',
    content: 'Quantinum-Q system specifications and design guidelines. The system leverages state-of-the-art visual engines and a sandbox execution container for local Pyodide scripts. Performance is monitored continuously in the Telemetry dashboard. Please review the memory requirements and CPU thread responsiveness.',
    updatedAt: Date.now() - 3600000 * 24
  },
  {
    id: 'word-manual',
    title: 'User Manual & Commands',
    content: 'Quantinum-Q Voice Navigation guidelines:\nUse "go home" or "back" to navigate to the system center.\nUse "open cosmic word" to start typing in the rich document editor.\nUse "open cosmic excel" to open the reactive spreadsheet editor.\nUse "open performance" to view the live telemetry diagnostics.\nEnsure the mic permissions are enabled in your browser settings.',
    updatedAt: Date.now() - 3600000 * 12
  }
];

const DEFAULT_EXCEL_DOCS: ExcelDocument[] = [
  {
    id: 'excel-ledger-1',
    title: 'Finance Ledger',
    grid: Array.from({ length: 20 }, (_, rIndex) =>
      Array.from({ length: 10 }, (_, cIndex) => {
        if (rIndex === 0 && cIndex === 0) return { value: 'Revenue', formula: '' };
        if (rIndex === 0 && cIndex === 1) return { value: '12000', formula: '' };
        if (rIndex === 1 && cIndex === 0) return { value: 'Expenses', formula: '' };
        if (rIndex === 1 && cIndex === 1) return { value: '4500', formula: '' };
        if (rIndex === 2 && cIndex === 0) return { value: 'Profit margin calculation sheet', formula: '' };
        if (rIndex === 2 && cIndex === 1) return { value: '7500', formula: '=B1-B2' };
        return { value: '', formula: '' };
      })
    ),
    updatedAt: Date.now() - 3600000 * 6
  }
];

// --- WORD STORAGE ---
export const getWordDocuments = (): WordDocument[] => {
  try {
    const data = localStorage.getItem(WORD_DOCS_KEY);
    if (!data) {
      localStorage.setItem(WORD_DOCS_KEY, JSON.stringify(DEFAULT_WORD_DOCS));
      return DEFAULT_WORD_DOCS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading word docs', err);
    return DEFAULT_WORD_DOCS;
  }
};

export const saveWordDocument = (doc: WordDocument): void => {
  try {
    const docs = getWordDocuments();
    const idx = docs.findIndex(d => d.id === doc.id);
    if (idx !== -1) {
      docs[idx] = { ...doc, updatedAt: Date.now() };
    } else {
      docs.push({ ...doc, updatedAt: Date.now() });
    }
    localStorage.setItem(WORD_DOCS_KEY, JSON.stringify(docs));
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Word Document Saved',
        message: `Successfully synchronized document: "${doc.title}"`,
        type: 'success'
      }
    }));
    window.dispatchEvent(new Event('cosmic-document-sync'));
  } catch (err) {
    console.error('Error saving word doc', err);
  }
};

export const deleteWordDocument = (id: string): void => {
  try {
    const docs = getWordDocuments().filter(d => d.id !== id);
    localStorage.setItem(WORD_DOCS_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('Error deleting word doc', err);
  }
};

// --- EXCEL STORAGE ---
export const getExcelDocuments = (): ExcelDocument[] => {
  try {
    const data = localStorage.getItem(EXCEL_DOCS_KEY);
    if (!data) {
      localStorage.setItem(EXCEL_DOCS_KEY, JSON.stringify(DEFAULT_EXCEL_DOCS));
      return DEFAULT_EXCEL_DOCS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading excel docs', err);
    return DEFAULT_EXCEL_DOCS;
  }
};

export const saveExcelDocument = (doc: ExcelDocument): void => {
  try {
    const docs = getExcelDocuments();
    const idx = docs.findIndex(d => d.id === doc.id);
    if (idx !== -1) {
      docs[idx] = { ...doc, updatedAt: Date.now() };
    } else {
      docs.push({ ...doc, updatedAt: Date.now() });
    }
    localStorage.setItem(EXCEL_DOCS_KEY, JSON.stringify(docs));
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Excel Spreadsheet Saved',
        message: `Successfully updated spreadsheet: "${doc.title}"`,
        type: 'success'
      }
    }));
    window.dispatchEvent(new Event('cosmic-document-sync'));
  } catch (err) {
    console.error('Error saving excel doc', err);
  }
};

export const deleteExcelDocument = (id: string): void => {
  try {
    const docs = getExcelDocuments().filter(d => d.id !== id);
    localStorage.setItem(EXCEL_DOCS_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('Error deleting excel doc', err);
  }
};

// --- PYTHON STORAGE ---
export const getPythonDocuments = (): PythonDocument[] => {
  try {
    const data = localStorage.getItem(PYTHON_DOCS_KEY);
    if (!data) {
      localStorage.setItem(PYTHON_DOCS_KEY, JSON.stringify(DEFAULT_PYTHON_DOCS));
      return DEFAULT_PYTHON_DOCS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading python docs', err);
    return DEFAULT_PYTHON_DOCS;
  }
};

export const savePythonDocument = (doc: PythonDocument): void => {
  try {
    const docs = getPythonDocuments();
    const idx = docs.findIndex(d => d.id === doc.id);
    if (idx !== -1) {
      docs[idx] = { ...doc, updatedAt: Date.now() };
    } else {
      docs.push({ ...doc, updatedAt: Date.now() });
    }
    localStorage.setItem(PYTHON_DOCS_KEY, JSON.stringify(docs));
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Python Script Saved',
        message: `Successfully updated Python code: "${doc.title}"`,
        type: 'success'
      }
    }));
    window.dispatchEvent(new Event('cosmic-document-sync'));
  } catch (err) {
    console.error('Error saving python doc', err);
  }
};

export const deletePythonDocument = (id: string): void => {
  try {
    const docs = getPythonDocuments().filter(d => d.id !== id);
    localStorage.setItem(PYTHON_DOCS_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('Error deleting python doc', err);
  }
};

// --- GLOBAL FULL-TEXT SEARCH ---
export const searchAllDocuments = (query: string): SearchResult[] => {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];

  const results: SearchResult[] = [];
  const words = getWordDocuments();
  const excels = getExcelDocuments();
  const pythons = getPythonDocuments();

  // Search in Word documents
  words.forEach(doc => {
    let score = 0;
    const titleMatch = doc.title.toLowerCase().includes(cleanQuery);
    const contentMatch = doc.content.toLowerCase().includes(cleanQuery);

    if (titleMatch) score += 10;
    if (contentMatch) {
      // Count frequency of matches
      const occurrences = (doc.content.toLowerCase().split(cleanQuery).length - 1);
      score += occurrences * 2;
    }

    if (score > 0) {
      // Generate a nice snippet highlighting the search context
      let snippet = '';
      const text = doc.content;
      const index = text.toLowerCase().indexOf(cleanQuery);
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + cleanQuery.length + 60);
        snippet = (start > 0 ? '...' : '') + text.substring(start, end).replace(/\n/g, ' ') + (end < text.length ? '...' : '');
      } else {
        snippet = text.substring(0, 80) + (text.length > 80 ? '...' : '');
      }

      results.push({
        id: doc.id,
        type: 'word',
        title: doc.title,
        snippet,
        score,
        updatedAt: doc.updatedAt
      });
    }
  });

  // Search in Excel spreadsheets
  excels.forEach(doc => {
    let score = 0;
    const titleMatch = doc.title.toLowerCase().includes(cleanQuery);
    if (titleMatch) score += 10;

    // Concatenate all text/formulas in the grid
    let allCellTexts: string[] = [];
    doc.grid.forEach(row => {
      row.forEach(cell => {
        if (cell.value) allCellTexts.push(cell.value);
        if (cell.formula) allCellTexts.push(cell.formula);
      });
    });

    const fullSheetText = allCellTexts.join(' ');
    const cellMatchCount = (fullSheetText.toLowerCase().split(cleanQuery).length - 1);

    if (cellMatchCount > 0) {
      score += cellMatchCount * 3;
    }

    if (score > 0) {
      // Generate snippet
      let snippet = `Cells match: ${allCellTexts.filter(t => t.toLowerCase().includes(cleanQuery)).slice(0, 3).join(', ')}`;
      if (!snippet || snippet === 'Cells match: ') {
        snippet = `Spreadsheet containing ${allCellTexts.length} data values.`;
      } else if (snippet.length > 80) {
        snippet = snippet.substring(0, 80) + '...';
      }

      results.push({
        id: doc.id,
        type: 'excel',
        title: doc.title,
        snippet,
        score,
        updatedAt: doc.updatedAt
      });
    }
  });

  // Search in Python documents
  pythons.forEach(doc => {
    let score = 0;
    const titleMatch = doc.title.toLowerCase().includes(cleanQuery);
    const contentMatch = doc.code.toLowerCase().includes(cleanQuery);

    if (titleMatch) score += 10;
    if (contentMatch) {
      const occurrences = (doc.code.toLowerCase().split(cleanQuery).length - 1);
      score += occurrences * 2;
    }

    if (score > 0) {
      let snippet = '';
      const text = doc.code;
      const index = text.toLowerCase().indexOf(cleanQuery);
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + cleanQuery.length + 60);
        snippet = (start > 0 ? '...' : '') + text.substring(start, end).replace(/\n/g, ' ') + (end < text.length ? '...' : '');
      } else {
        snippet = text.substring(0, 80) + (text.length > 80 ? '...' : '');
      }

      results.push({
        id: doc.id,
        type: 'python',
        title: doc.title,
        snippet,
        score,
        updatedAt: doc.updatedAt
      });
    }
  });

  // Sort by score descending, then by updatedAt descending
  return results.sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt);
};

// --- CLIPBOARD MANAGER ---
export const getClipboardItems = (): ClipboardItem[] => {
  try {
    const data = localStorage.getItem(CLIPBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error loading clipboard', err);
    return [];
  }
};

export const addClipboardItem = (text: string, source: 'word' | 'excel' | 'chat'): ClipboardItem[] => {
  const trimmed = text.trim();
  if (!trimmed) return getClipboardItems();

  try {
    let items = getClipboardItems();
    
    // De-duplicate: remove if identical text is copied, to place it at the top
    items = items.filter(item => item.text !== trimmed);

    const newItem: ClipboardItem = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text: trimmed,
      timestamp: Date.now(),
      source
    };

    items.unshift(newItem);
    
    // Cap at 15 items
    if (items.length > 15) {
      items = items.slice(0, 15);
    }

    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(items));
    
    // Dispatch a global event to notify the Clipboard panel to update
    window.dispatchEvent(new CustomEvent('cosmic-clipboard-update', { detail: items }));
    
    return items;
  } catch (err) {
    console.error('Error saving clipboard item', err);
    return getClipboardItems();
  }
};

export const clearClipboard = (): void => {
  try {
    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('cosmic-clipboard-update', { detail: [] }));
  } catch (err) {
    console.error('Error clearing clipboard', err);
  }
};
