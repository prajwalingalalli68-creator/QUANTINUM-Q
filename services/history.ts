export interface HistoryItem {
  id: string;
  type: string; // 'CHAT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'BANNER', etc.
  title: string;
  timestamp: number;
  data?: any;
}

const HISTORY_KEY = 'quantinum_history';

export const getHistory = (): HistoryItem[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to get history', e);
    return [];
  }
};

export const saveToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  try {
    const history = getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    history.unshift(newItem);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100))); // Keep last 100
  } catch (e) {
    console.error('Failed to save history', e);
  }
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const searchHistory = (query: string): HistoryItem[] => {
  const history = getHistory();
  if (!query.trim()) return history;
  const q = query.toLowerCase();
  return history.filter(item => 
    item.title.toLowerCase().includes(q) || 
    item.type.toLowerCase().includes(q) ||
    (item.data && typeof item.data === 'string' && item.data.toLowerCase().includes(q))
  );
};
