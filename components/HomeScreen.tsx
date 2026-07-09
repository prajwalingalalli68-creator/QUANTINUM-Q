
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppMode, ThemeMode } from '../types';
import { getWordDocuments, getExcelDocuments, getPythonDocuments, getClipboardItems, saveWordDocument } from '../services/documentStorage';
import { saveSetting } from '../services/indexedDBCache';
import { SystemLogs } from './SystemLogs';

interface HomeScreenProps {
  onEnter: (mode: AppMode) => void;
  isPremium: boolean;
  onUnlockPremium: () => void;
  themeMode?: ThemeMode;
}

interface RecentItem {
  id: string;
  title: string;
  type: 'word' | 'excel' | 'python';
  updatedAt: number;
  mode: AppMode;
  icon: string;
  color: string;
}

interface ActiveTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onEnter, isPremium, onUnlockPremium, themeMode = ThemeMode.DARK }) => {
  const [time, setTime] = useState(new Date());
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const isMenuOpen = activeScreenIndex > 0;
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Scratchpad (Mini Note) state
  const [miniNote, setMiniNote] = useState(() => localStorage.getItem('quantinum_mini_note') || '');

  useEffect(() => {
    localStorage.setItem('quantinum_mini_note', miniNote);
  }, [miniNote]);

  useEffect(() => {
    const handleLock = () => {
      setActiveScreenIndex(0);
    };
    window.addEventListener('cosmic-lock-screen', handleLock);
    return () => window.removeEventListener('cosmic-lock-screen', handleLock);
  }, []);

  const [miniNotesList, setMiniNotesList] = useState<{ id: string; title: string; text: string; priority: 'high' | 'medium' | 'low'; pinned?: boolean; synced: boolean; timestamp: number }[]>(() => {
    try {
      const saved = localStorage.getItem('quantinum_mini_notes_list');
      return saved ? JSON.parse(saved) : [
        { id: 'note-1', title: 'System Diagnostics', text: 'Quantum telemetry indicates stable energy core levels.', priority: 'high', pinned: true, synced: true, timestamp: Date.now() - 3600000 },
        { id: 'note-2', title: 'Python Code Optimization', text: 'Remember to check on python optimization logs.', priority: 'medium', pinned: false, synced: true, timestamp: Date.now() - 1200000 }
      ];
    } catch {
      return [];
    }
  });

  // Mini Note Manager States
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [activeNoteTab, setActiveNoteTab] = useState<'list' | 'create'>('list');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNotePriority, setNewNotePriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newNotePinned, setNewNotePinned] = useState(false);

  // Speech Recognition Setup
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const isSpeechSupported = !!SpeechRecognition;
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  const startSpeechDictation = () => {
    if (!isSpeechSupported) {
      window.dispatchEvent(new CustomEvent('cosmic-notification', {
        detail: {
          title: 'Speech Unsupported',
          message: 'Voice speech recognition is not supported in this browser.',
          type: 'error'
        }
      }));
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: {
            title: 'Listening...',
            message: 'Voice dictation active. Speak clearly.',
            type: 'info'
          }
        }));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: {
            title: 'Speech Error',
            message: `Voice error: ${event.error}. Please check mic permissions.`,
            type: 'error'
          }
        }));
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        if (transcript && transcript.trim()) {
          setNewNoteText(prev => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopSpeechDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Failed to stop recognition:', e);
      }
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const [focusLabel, setFocusLabel] = useState('Deep Work');

  const [clipboardItems, setClipboardItems] = useState<any[]>([]);

  useEffect(() => {
    setClipboardItems(getClipboardItems());

    const handleClipUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setClipboardItems(customEvent.detail);
      }
    };

    window.addEventListener('cosmic-clipboard-update', handleClipUpdate);
    return () => window.removeEventListener('cosmic-clipboard-update', handleClipUpdate);
  }, []);

  const handleTogglePinClipboardItem = (itemId: string) => {
    const updated = clipboardItems.map(item => {
      if (item.id === itemId) {
        return { ...item, pinned: !item.pinned };
      }
      return item;
    });
    setClipboardItems(updated);
    localStorage.setItem('quantinum_clipboard_items', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cosmic-clipboard-update', { detail: updated }));
    
    const targetItem = updated.find(i => i.id === itemId);
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: targetItem?.pinned ? 'Item Pinned' : 'Item Unpinned',
        message: targetItem?.pinned ? 'Entry pinned at top of the list.' : 'Entry unpinned.',
        type: 'success'
      }
    }));
  };

  const handleDeleteClipboardItem = (itemId: string) => {
    const updated = clipboardItems.filter(item => item.id !== itemId);
    setClipboardItems(updated);
    localStorage.setItem('quantinum_clipboard_items', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cosmic-clipboard-update', { detail: updated }));
    
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Entry Deleted',
        message: 'Snippet removed from clipboard history.',
        type: 'info'
      }
    }));
  };

  const syncNotesToDB = async (notes: any[]) => {
    try {
      await saveSetting('synced_mini_notes', notes);
      
      // Update local state to show synced status
      const syncedNotes = notes.map(n => ({ ...n, synced: true }));
      setMiniNotesList(syncedNotes);
      localStorage.setItem('quantinum_mini_notes_list', JSON.stringify(syncedNotes));
    } catch (err) {
      console.warn('Error syncing notes to IndexedDB:', err);
    }
  };

  useEffect(() => {
    const handleOnlineSync = () => {
      const unsyncedExist = miniNotesList.some(n => !n.synced);
      if (unsyncedExist) {
        syncNotesToDB(miniNotesList);
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: {
            title: 'Background Sync Complete',
            message: 'All scratchpad notes synchronized successfully to cloud database.',
            type: 'success'
          }
        }));
      }
    };
    window.addEventListener('online', handleOnlineSync);
    return () => window.removeEventListener('online', handleOnlineSync);
  }, [miniNotesList]);

  const handleSaveQuickNote = (text: string, title?: string, priority?: 'high' | 'medium' | 'low', pinned?: boolean) => {
    if (!text.trim()) return;
    const isOnlineSystem = navigator.onLine;
    const noteId = selectedNoteId || `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    const existingNote = miniNotesList.find(n => n.id === selectedNoteId);
    const wasPinned = existingNote ? !!existingNote.pinned : false;
    const isPinned = pinned !== undefined ? pinned : (selectedNoteId ? wasPinned : newNotePinned);

    const newNote = {
      id: noteId,
      title: (title || '').trim() || 'Untitled Note',
      text: text.trim(),
      priority: priority || 'medium',
      pinned: isPinned,
      synced: isOnlineSystem,
      timestamp: Date.now()
    };
    
    let updated;
    if (selectedNoteId) {
      updated = miniNotesList.map(n => n.id === selectedNoteId ? newNote : n);
    } else {
      updated = [newNote, ...miniNotesList];
    }
    
    setMiniNotesList(updated);
    localStorage.setItem('quantinum_mini_notes_list', JSON.stringify(updated));
    
    // Clear form states
    setNewNoteTitle('');
    setNewNoteText('');
    setNewNotePriority('medium');
    setNewNotePinned(false);
    setSelectedNoteId(null);
    setActiveNoteTab('list');

    window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
      detail: { api: 'MiniNotes.saveQuickNote', status: 'Success' }
    }));

    if (isOnlineSystem) {
      syncNotesToDB(updated);
    } else {
      window.dispatchEvent(new CustomEvent('cosmic-notification', {
        detail: {
          title: 'Note Saved (Offline)',
          message: 'Saved locally. Synchronization pending connection.',
          type: 'info'
        }
      }));
    }
  };

  const handleTogglePinNote = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const updated = miniNotesList.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    setMiniNotesList(updated);
    localStorage.setItem('quantinum_mini_notes_list', JSON.stringify(updated));
    
    const targetNote = updated.find(n => n.id === id);
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: targetNote?.pinned ? 'Note Pinned' : 'Note Unpinned',
        message: targetNote?.pinned ? `"${targetNote.title}" pinned at the top.` : `"${targetNote.title}" unpinned.`,
        type: 'success'
      }
    }));

    if (navigator.onLine) {
      syncNotesToDB(updated);
    }
  };

  const handleDeleteQuickNote = (id: string) => {
    const updated = miniNotesList.filter(n => n.id !== id);
    setMiniNotesList(updated);
    localStorage.setItem('quantinum_mini_notes_list', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
      detail: { api: 'MiniNotes.deleteQuickNote', status: 'Success' }
    }));
    
    if (navigator.onLine) {
      syncNotesToDB(updated);
    }
  };

  const getNoteRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Focus Timer state
  const [focusTimeLeft, setFocusTimeLeft] = useState<number>(0);
  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [isFocusActive, setIsFocusActive] = useState<boolean>(false);
  const [focusLogs, setFocusLogs] = useState<{ id: string; duration: number; label?: string; timestamp: number }[]>(() => {
    const stored = localStorage.getItem('quantinum_focus_logs');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('quantinum_focus_logs', JSON.stringify(focusLogs));
  }, [focusLogs]);

  useEffect(() => {
    let interval: any = null;
    if (isFocusActive && focusTimeLeft > 0) {
      interval = setInterval(() => {
        setFocusTimeLeft(prev => {
          if (prev <= 1) {
            setIsFocusActive(false);
            const durationMin = focusDuration;
            const newLog = {
              id: `focus-${Date.now()}`,
              duration: durationMin,
              label: focusLabel,
              timestamp: Date.now()
            };
            setFocusLogs(l => [newLog, ...l]);
            
            // Turn off DND
            window.dispatchEvent(new CustomEvent('cosmic-set-dnd', { detail: { dnd: false } }));
            
            window.dispatchEvent(new CustomEvent('cosmic-notification', {
              detail: {
                title: 'Focus Session Completed!',
                message: `Spectacular job! You completed a ${durationMin}-minute deep work session ("${focusLabel}"). DND deactivated.`,
                type: 'success'
              }
            }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isFocusActive) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isFocusActive, focusTimeLeft, focusDuration, focusLabel]);

  const startFocusSession = () => {
    setFocusTimeLeft(focusDuration * 60);
    setIsFocusActive(true);
    
    // Turn on DND
    window.dispatchEvent(new CustomEvent('cosmic-set-dnd', { detail: { dnd: true } }));
    
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Focus Session Started',
        message: `Do Not Disturb activated. Time to concentrate for ${focusDuration} minutes on "${focusLabel}"!`,
        type: 'info'
      }
    }));
  };

  const cancelFocusSession = () => {
    setIsFocusActive(false);
    setFocusTimeLeft(0);
    
    // Turn off DND
    window.dispatchEvent(new CustomEvent('cosmic-set-dnd', { detail: { dnd: false } }));
    
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Focus Session Cancelled',
        message: 'Do Not Disturb deactivated.',
        type: 'info'
      }
    }));
  };


  // System Resources telemetry state
  const [cpuUsage, setCpuUsage] = useState(38);
  const [ramUsage, setRamUsage] = useState(58);
  const [gpuUsage, setGpuUsage] = useState(24);
  const [cpuTemp, setCpuTemp] = useState(52);
  const [gpuClock, setGpuClock] = useState(1410);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    if (isOptimizing) return;
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const delta = Math.floor(Math.random() * 15) - 7;
        const next = Math.max(10, Math.min(95, prev + delta));
        setCpuTemp(Math.floor(40 + (next * 0.4) + Math.random() * 5));
        return next;
      });
      setRamUsage(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(40, Math.min(90, prev + delta));
      });
      setGpuUsage(prev => {
        const delta = Math.floor(Math.random() * 11) - 5;
        const next = Math.max(5, Math.min(90, prev + delta));
        setGpuClock(Math.floor(1300 + (next * 2) + Math.random() * 30));
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isOptimizing]);

  const handleOptimizeSystem = () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    setCpuUsage(92);
    setCpuTemp(78);
    setGpuUsage(85);
    setGpuClock(1850);
    
    window.dispatchEvent(new CustomEvent('cosmic-notification', {
      detail: {
        title: 'Running System Optimization',
        message: 'Purging caches, terminating idle workers, and reallocating heap memory...',
        type: 'info'
      }
    }));

    setTimeout(() => {
      setCpuUsage(12);
      setCpuTemp(44);
      setRamUsage(35);
      setGpuUsage(4);
      setGpuClock(300);
      setIsOptimizing(false);
      window.dispatchEvent(new CustomEvent('cosmic-notification', {
        detail: {
          title: 'Optimization Complete',
          message: 'Cache purged. 3.2 GB RAM recovered. Core temperatures lowered to 44°C.',
          type: 'success'
        }
      }));
    }, 1500);
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  // Load active tasks from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('quantinum_active_tasks');
    if (stored) {
      try {
        setActiveTasks(JSON.parse(stored));
      } catch (err) {
        console.error('Error loading active tasks', err);
      }
    } else {
      const initial: ActiveTask[] = [
        { id: 'task-1', text: 'Analyze financial projections in Finance Ledger', completed: false, createdAt: Date.now() - 3600000 },
        { id: 'task-2', text: 'Polishing system manual in Cosmic Word', completed: true, createdAt: Date.now() - 1800000 },
        { id: 'task-3', text: 'Test neural network sequence in Cosmic Python', completed: false, createdAt: Date.now() }
      ];
      setActiveTasks(initial);
      localStorage.setItem('quantinum_active_tasks', JSON.stringify(initial));
    }
  }, []);

  const saveTasks = (tasks: ActiveTask[]) => {
    setActiveTasks(tasks);
    localStorage.setItem('quantinum_active_tasks', JSON.stringify(tasks));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: ActiveTask = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      createdAt: Date.now()
    };
    saveTasks([newTask, ...activeTasks]);
    setNewTaskText('');
  };

  const handleToggleTask = (id: string) => {
    const updated = activeTasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          window.dispatchEvent(new CustomEvent('cosmic-notification', {
            detail: {
              title: 'Objective Completed',
              message: `Task achieved: "${t.text}"`,
              type: 'success'
            }
          }));
        }
        return { ...t, completed: nextCompleted };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = activeTasks.filter(t => t.id !== id);
    saveTasks(updated);
  };
  
  const [radialMenuPos, setRadialMenuPos] = useState<{x: number, y: number} | null>(null);

  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    // Dynamically retrieve actual recently modified files across Word, Excel, and Python
    const words = getWordDocuments().map(w => ({
      id: w.id,
      title: w.title,
      type: 'word' as const,
      updatedAt: w.updatedAt,
      mode: AppMode.WORD,
      icon: 'fa-file-word',
      color: 'text-blue-400'
    }));

    const excels = getExcelDocuments().map(e => ({
      id: e.id,
      title: e.title,
      type: 'excel' as const,
      updatedAt: e.updatedAt,
      mode: AppMode.EXCEL,
      icon: 'fa-file-excel',
      color: 'text-emerald-400'
    }));

    const pythons = getPythonDocuments().map(p => ({
      id: p.id,
      title: p.title,
      type: 'python' as const,
      updatedAt: p.updatedAt,
      mode: AppMode.PYTHON,
      icon: 'fa-brands fa-python',
      color: 'text-cyan-400'
    }));

    const sorted = [...words, ...excels, ...pythons]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5);

    setRecentItems(sorted);
  }, []);

  const handleOpenRecent = (item: RecentItem) => {
    // Enter the correct application mode
    handleItemClick(item.mode, false);
    
    // Fire the global trigger so that the tool views open this document immediately on load
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('cosmic-open-document', {
        detail: { id: item.id, type: item.type }
      }));
    }, 150);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClick = () => setRadialMenuPos(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setRadialMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const distance = touchStart - e.changedTouches[0].clientY;
    if (distance > 50) setActiveScreenIndex(prev => Math.min(2, prev + 1));
    if (distance < -50) setActiveScreenIndex(prev => Math.max(0, prev - 1));
  };

  const menuItems = [
    { mode: AppMode.ORACLE, label: 'Cosmic Oracle', icon: 'fa-eye', color: 'from-violet-600 via-indigo-600 to-purple-600', isPremiumFeature: false },
    { mode: AppMode.IMAGE, label: 'Cosmic Image', icon: 'fa-wand-magic-sparkles', color: 'from-pink-500 via-rose-500 to-orange-500', isPremiumFeature: true },
    { mode: AppMode.BANNER_CREATOR, label: 'Cosmic Banner Creator', icon: 'fa-panorama', color: 'from-orange-600 via-yellow-500 to-red-500', isPremiumFeature: true },
    { mode: AppMode.COSMIC_CERTIFICATE, label: 'Cosmic Certificate Suite', icon: 'fa-certificate', color: 'from-amber-400 via-orange-500 to-yellow-600', isPremiumFeature: true },
    { mode: AppMode.COUNTRY_INFORMER, label: 'Cosmic Country Informer', icon: 'fa-earth-asia', color: 'from-emerald-600 via-cyan-600 to-blue-600', isPremiumFeature: false },
    { mode: AppMode.PYTHON, label: 'Cosmic Python', icon: 'fa-brands fa-python', color: 'from-blue-600 via-indigo-600 to-yellow-600', isPremiumFeature: true },
    { mode: AppMode.EDITOR, label: 'Cosmic Editor', icon: 'fa-pen-nib', color: 'from-slate-600 via-gray-700 to-slate-800', isPremiumFeature: false },
    { mode: AppMode.EXCEL, label: 'Cosmic Excel', icon: 'fa-table', color: 'from-emerald-500 via-green-600 to-teal-600', isPremiumFeature: true },
    { mode: AppMode.WORD, label: 'Cosmic Word', icon: 'fa-file-word', color: 'from-blue-500 via-cyan-500 to-indigo-500', isPremiumFeature: true },
    { mode: AppMode.POWER_POINT, label: 'Cosmic Power Point', icon: 'fa-presentation-screen', color: 'from-orange-500 via-amber-500 to-yellow-600', isPremiumFeature: true },
    { mode: AppMode.GAMES, label: 'Cosmic Game Zone', icon: 'fa-gamepad', color: 'from-purple-500 via-fuchsia-500 to-pink-500', isPremiumFeature: false },
    { mode: AppMode.PROJECT_MAKER, label: 'Cosmic Project Maker', icon: 'fa-rocket', color: 'from-teal-500 via-emerald-600 to-cyan-600', isPremiumFeature: true },
    { mode: AppMode.VIDEO_GEN, label: 'Cosmic Video', icon: 'fa-video', color: 'from-red-600 via-rose-600 to-orange-600', isPremiumFeature: true },
    { mode: AppMode.DICTIONARY, label: 'Oxford Lexicon', icon: 'fa-book', color: 'from-indigo-700 via-blue-800 to-slate-900', isPremiumFeature: false },
    { mode: AppMode.TRANSLATOR, label: 'Universal Translator', icon: 'fa-language', color: 'from-cyan-400 via-blue-500 to-indigo-600', isPremiumFeature: false },
    { mode: AppMode.LOGO_INVENTOR, label: 'Logo Inventor', icon: 'fa-signature', color: 'from-emerald-400 via-teal-500 to-cyan-600', isPremiumFeature: true },
    { mode: AppMode.EXAM, label: 'Exam Prep', icon: 'fa-graduation-cap', color: 'from-amber-500 via-orange-600 to-red-700', isPremiumFeature: true },
    { mode: AppMode.HISTORY, label: 'History', icon: 'fa-timeline', color: 'from-slate-700 via-slate-800 to-slate-900', isPremiumFeature: false },
    { mode: AppMode.THEMES, label: 'Theme Settings', icon: 'fa-palette', color: 'from-pink-500 via-rose-500 to-red-500', isPremiumFeature: false },
    { mode: AppMode.PERFORMANCE, label: 'Performance', icon: 'fa-chart-pie', color: 'from-green-500 via-emerald-600 to-teal-700', isPremiumFeature: false },
    { mode: AppMode.ARCHITECT, label: 'Cosmic Architect', icon: 'fa-pencil-ruler', color: 'from-cyan-900 via-slate-900 to-slate-950', isPremiumFeature: true },
    { mode: AppMode.COSMIC_WATCH, label: 'Cosmic Alarms & Watch', icon: 'fa-clock', color: 'from-amber-500 via-rose-500 to-indigo-500', isPremiumFeature: false },
  ];

  const developers = [
    "CAPTAIN: DHRUVA",
    "DIGITAL CAPTAIN: PRAJWAL",
    "DIGITAL VICE CAPTAIN: ATHARVA",
    "PHYSICAL CAPTAIN: PREETAM",
    "PHYSICAL VICE CAPTAIN: SAMPREETH",
    "SANKALPH",
    "VIKAS"
  ];

  const handleItemClick = (mode: AppMode, isPremiumFeature: boolean) => {
    if (isPremiumFeature && !isPremium) {
      setShowPromoModal(true);
    } else {
      onEnter(mode);
    }
  };

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim() === '1835') {
      onUnlockPremium();
      setShowPromoModal(false);
      setPromoError('');
      setPromoCode('');
    } else {
      setPromoError('Invalid promo code. Please try again.');
    }
  };

  const isLight = themeMode === ThemeMode.LIGHT;
  const isColourful = themeMode === ThemeMode.COLORFUL;

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden font-sans transition-all duration-500 ${
        isLight 
          ? 'bg-white text-slate-900' 
          : isColourful
            ? 'bg-gradient-to-tr from-fuchsia-950 via-purple-950 to-indigo-950 text-white'
            : 'bg-slate-950 text-white'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 scale-110 blur-sm"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop')" }}
        />
        {/* Animated Colorful Background Blobs - Rainbow Edition */}
        {themeMode === ThemeMode.COLORFUL ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-600/30 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-yellow-600/30 rounded-full blur-[120px] animate-pulse [animation-delay:1s]"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-green-600/30 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px] animate-pulse [animation-delay:3s]"></div>
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-purple-600/30 rounded-full blur-[100px] animate-pulse [animation-delay:4s]"></div>
          </>
        ) : isLight ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-pink-100/40 rounded-full blur-[120px] animate-pulse [animation-delay:1.5s]"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px] animate-pulse [animation-delay:3s]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-zinc-900/30 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-neutral-900/40 rounded-full blur-[120px] animate-pulse [animation-delay:1s]"></div>
          </>
        )}
        <div className={`absolute inset-0 ${
          isLight ? 'bg-gradient-to-t from-white via-transparent to-white/30' : 'bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30'
        }`} />
      </div>

      <div className={`absolute inset-0 z-10 flex flex-col items-center justify-between p-8 transition-all duration-700 ease-in-out ${
        activeScreenIndex === 0 ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="w-full h-10"></div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex flex-col items-center gap-2">
            <h1 className={`text-5xl md:text-8xl font-black tracking-[0.15em] font-display select-none ${
              isLight ? 'text-slate-900' : 'animate-gradient-text text-white drop-shadow-[0_0_35px_rgba(34,211,238,0.35)]'
            }`}>
              QUANTINUM-Q
            </h1>
          </div>

          <div className="text-8xl md:text-[12rem] font-black tracking-tighter mb-4 font-mono tabular-nums leading-none">
            <span className={`${isLight ? 'text-slate-900' : 'text-gradient'} drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]`}>
              {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
            </span>
            <span className={`text-4xl md:text-7xl opacity-80 ml-4 ${isLight ? 'text-slate-600' : 'text-gradient'}`}>
              :{time.getSeconds().toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <span className={`text-3xl md:text-5xl font-black tracking-[0.25em] uppercase ${
              isLight ? 'text-slate-900' : 'text-white drop-shadow-[0_2px_15px_rgba(255,255,255,0.3)]'
            }`}>
              {new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(time)}
            </span>
            <span className={`text-xl md:text-2xl font-bold tracking-[0.3em] uppercase ${
              isLight ? 'text-slate-600' : 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]'
            }`}>
              {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(time)}
            </span>
            {time.getMonth() === 1 && time.getDate() === 19 && (
              <div className="mt-4 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full animate-bounce">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-gradient">Special Event: Feb 19 Active</span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => setActiveScreenIndex(1)}
          className="group flex flex-col items-center gap-3 transition-all cursor-pointer select-none"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 blur-3xl opacity-75 rounded-full animate-pulse"></div>
            <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center group-hover:bg-opacity-100 transition-all duration-500 shadow-md ${
              isLight 
                ? 'border-slate-300 bg-slate-100 hover:bg-slate-200' 
                : 'border-cyan-400/40 bg-slate-900/80 backdrop-blur-3xl group-hover:bg-slate-950 group-hover:border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
            }`}>
              <i className={`fas fa-chevron-down text-2xl animate-bounce ${
                isLight ? 'text-slate-800' : 'text-cyan-400'
              }`}></i>
            </div>
          </div>
          <span className={`text-[10px] uppercase tracking-[0.6em] font-black transition-colors ${
            isLight ? 'text-slate-600 group-hover:text-slate-900' : 'text-cyan-400/90 group-hover:text-white drop-shadow-lg'
          }`}>Scroll Down to Workspace</span>
        </button>
      </div>



      {/* Page 3: 3rd Home Screen (Command Center & Custom Active Dashboards) */}
      <div className={`absolute inset-0 z-30 flex flex-col items-center justify-between p-8 transition-all duration-700 ease-in-out overflow-y-auto ${
        activeScreenIndex === 2 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      } ${
        isLight ? 'bg-slate-100/95 backdrop-blur-3xl text-slate-900' : 'bg-slate-900/90 backdrop-blur-3xl text-white'
      }`}>
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className={`absolute top-0 left-0 w-full h-full ${
            isLight ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]'
          }`}></div>
        </div>

        {/* Scroll back up button */}
        <button 
          onClick={() => setActiveScreenIndex(1)} 
          className={`flex flex-col items-center gap-1.5 group transition-colors z-[60] select-none cursor-pointer shrink-0 mb-4 mt-6 ${
            isLight ? 'text-slate-500 hover:text-slate-800' : 'text-cyan-400/60 hover:text-cyan-400'
          }`}
        >
          <i className="fas fa-chevron-up text-xl group-hover:-translate-y-1 transition-transform animate-pulse"></i>
          <span className="text-[8px] font-mono tracking-[0.4em] uppercase font-black">Scroll Up to Workspace</span>
        </button>

        {/* Command Center Title */}
        <div className="text-center mb-4 shrink-0 z-30">
          <h2 className={`text-xl md:text-2xl font-black uppercase tracking-[0.25em] ${
            isLight ? 'text-slate-800' : 'text-gradient'
          }`}>
            QUANTINUM-Q COMMAND CENTER
          </h2>
          <p className="text-[8px] font-mono uppercase tracking-[0.2em] opacity-60 mt-0.5">
            System Objectives, Resource Monitors & Active Workspaces
          </p>
        </div>

        {/* Dynamic Dual-Sector Dashboard */}
        <div className="w-full max-w-6xl mb-8 relative z-30 animate-fade-in px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Active Tasks Panel */}
          <div className={`border rounded-[1.8rem] p-5 shadow-2xl flex flex-col h-[200px] transition-all duration-300 ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800' 
              : isColourful
                ? 'bg-gradient-to-br from-fuchsia-950/40 via-purple-950/40 to-cyan-950/40 border-pink-500/20 text-white backdrop-blur-2xl shadow-[0_0_20px_rgba(219,39,119,0.15)]'
                : 'bg-slate-900/60 border-white/10 text-white backdrop-blur-xl'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2.5 mb-3 ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cyan-500 flex items-center gap-2">
                <i className="fa-solid fa-clipboard-list text-cyan-500"></i>
                Active Task Center
              </h3>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isLight ? 'bg-blue-100 text-blue-700' : 'bg-cyan-500/10 text-cyan-400'
              }`}>
                {activeTasks.filter(t => !t.completed).length} Pending
              </span>
            </div>

            {/* Task Add Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
              <input 
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a priority objective..."
                className={`flex-1 border rounded-xl px-3 py-1.5 text-xs focus:outline-none font-mono ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 placeholder-slate-400' 
                    : 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50 placeholder-white/20'
                }`}
              />
              <button 
                type="submit"
                className={`font-bold px-3 rounded-xl text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  isLight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                <i className="fas fa-plus"></i>
              </button>
            </form>

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
              {activeTasks.length > 0 ? (
                activeTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`flex items-center justify-between border rounded-xl px-3 py-2 transition-all group ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-200' 
                        : 'bg-white/5 hover:bg-white/10 border-white/[0.05]'
                    }`}
                  >
                    <button 
                      onClick={() => handleToggleTask(task.id)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer text-inherit bg-transparent border-none p-0"
                    >
                      <i className={`far ${task.completed ? 'fa-check-circle text-cyan-500' : isLight ? 'fa-circle text-slate-300' : 'fa-circle text-white/20'} text-sm shrink-0 transition-colors`}></i>
                      <span className={`text-xs truncate ${
                        task.completed 
                          ? (isLight ? 'text-slate-400 line-through' : 'text-white/30 line-through') 
                          : (isLight ? 'text-slate-800' : 'text-white/80')
                      }`}>
                        {task.text}
                      </span>
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 cursor-pointer ${
                        isLight ? 'text-slate-400 hover:text-red-500' : 'text-white/20 hover:text-red-400'
                      }`}
                      title="Delete objective"
                    >
                      <i className="fas fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                ))
              ) : (
                <div className={`h-full flex items-center justify-center text-[10px] font-mono uppercase tracking-widest text-center py-4 ${
                  isLight ? 'text-slate-400' : 'text-white/20'
                }`}>
                  No active tasks. Add one above!
                </div>
              )}
            </div>
          </div>

          {/* Recent Files Panel */}
          <div className={`border rounded-[1.8rem] p-5 shadow-2xl flex flex-col h-[200px] transition-all duration-300 ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800' 
              : isColourful
                ? 'bg-gradient-to-br from-fuchsia-950/40 via-purple-950/40 to-cyan-950/40 border-pink-500/20 text-white backdrop-blur-2xl shadow-[0_0_20px_rgba(219,39,119,0.15)]'
                : 'bg-slate-900/60 border-white/10 text-white backdrop-blur-xl'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2.5 mb-3 ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cyan-500 flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-cyan-500"></i>
                Recent Files Workspace
              </h3>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isLight ? 'bg-blue-100 text-blue-700' : 'bg-cyan-500/10 text-cyan-400'
              }`}>
                {recentItems.length} Saved
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
              {recentItems.length > 0 ? (
                recentItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleOpenRecent(item)}
                    className={`w-full flex items-center justify-between border rounded-xl px-3 py-2 transition-all text-left text-xs group cursor-pointer ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800' 
                        : 'bg-white/5 hover:bg-cyan-950/20 border-white/[0.05] text-white hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-slate-200/50' : 'bg-black/20'
                      }`}>
                        <i className={`fas ${item.icon} ${item.color} text-sm group-hover:scale-110 transition-transform`}></i>
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold transition-colors truncate max-w-[160px] ${
                          isLight ? 'text-slate-800 group-hover:text-cyan-600' : 'text-white group-hover:text-cyan-300'
                        }`}>{item.title}</div>
                        <div className={`text-[8px] font-mono uppercase mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{item.type} file</div>
                      </div>
                    </div>
                    <i className={`fas fa-chevron-right text-[9px] group-hover:translate-x-0.5 transition-transform ${
                      isLight ? 'text-slate-400' : 'text-white/20'
                    }`}></i>
                  </button>
                ))
              ) : (
                <div className={`h-full flex items-center justify-center text-[10px] font-mono uppercase tracking-widest text-center py-4 ${
                  isLight ? 'text-slate-400' : 'text-white/20'
                }`}>
                  No recent files available.
                </div>
              )}
            </div>
          </div>

          {/* Ephemeral Scratchpad Panel (High-Fidelity Mini-Note Widget) */}
          <div className={`border rounded-[1.8rem] p-5 shadow-2xl flex flex-col h-[200px] transition-all duration-300 relative overflow-hidden ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800' 
              : isColourful
                ? 'bg-gradient-to-br from-fuchsia-950/40 via-purple-950/40 to-cyan-950/40 border-pink-500/20 text-white backdrop-blur-2xl shadow-[0_0_20px_rgba(219,39,119,0.15)]'
                : 'bg-slate-900/60 border-white/10 text-white backdrop-blur-xl'
          }`}>
            {activeNoteTab === 'list' ? (
              <>
                {/* Header Row */}
                <div className={`flex items-center justify-between border-b pb-2 mb-2 ${
                  isLight ? 'border-slate-100' : 'border-white/5'
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cyan-500 flex items-center gap-2">
                    <i className="fa-solid fa-note-sticky text-cyan-500"></i>
                    Mini-Note Manager
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Sync Indicator */}
                    <span 
                      className={`text-[7px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-solid ${
                        navigator.onLine 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                      title={navigator.onLine ? "System Online: Syncing to Cloud" : "System Offline: Local Storage Mode"}
                    >
                      <span className={`w-1 h-1 rounded-full ${navigator.onLine ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                      {navigator.onLine ? 'Synced' : 'Offline'}
                    </span>
                    
                    {/* Vocal Dictation Shortcut Button */}
                    {isSpeechSupported && (
                      <button
                        onClick={() => {
                          setSelectedNoteId(null);
                          setNewNoteTitle('');
                          setNewNoteText('');
                          setNewNotePriority('medium');
                          setNewNotePinned(false);
                          setActiveNoteTab('create');
                          setTimeout(() => {
                            startSpeechDictation();
                          }, 100);
                        }}
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition-all border border-solid cursor-pointer active:scale-95 ${
                          isListening
                            ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                            : isLight 
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-600 border-rose-200' 
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                        }`}
                        title="Vocal Dictation Note (Hands-Free)"
                      >
                        <i className="fa-solid fa-microphone text-[10px]"></i>
                      </button>
                    )}

                    {/* Add button */}
                    <button
                      onClick={() => {
                        setSelectedNoteId(null);
                        setNewNoteTitle('');
                        setNewNoteText('');
                        setNewNotePriority('medium');
                        setNewNotePinned(false);
                        setActiveNoteTab('create');
                      }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition-all border border-solid cursor-pointer active:scale-95 ${
                        isLight 
                          ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500' 
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/20'
                      }`}
                      title="Create note"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                    </button>
                  </div>
                </div>

                {/* Search Bar Row */}
                <div className="mb-2 relative">
                  <i className={`fa-solid fa-magnifying-glass text-[9px] absolute left-2.5 top-1/2 -translate-y-1/2 ${
                    isLight ? 'text-slate-400' : 'text-white/30'
                  }`}></i>
                  <input
                    type="text"
                    value={noteSearchQuery}
                    onChange={(e) => setNoteSearchQuery(e.target.value)}
                    placeholder="Search titles or contents..."
                    className={`w-full text-[10px] font-mono pl-6.5 pr-2 py-1.5 rounded-lg border border-solid focus:outline-none transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white' 
                        : 'bg-black/20 border-white/5 text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:bg-black/40'
                    }`}
                  />
                  {noteSearchQuery && (
                    <button
                      onClick={() => setNoteSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <i className="fa-solid fa-xmark text-[9px]"></i>
                    </button>
                  )}
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 relative">
                  {(() => {
                    const filteredNotes = miniNotesList.filter(note => {
                      const isHighOrPinned = !!note.pinned || note.priority === 'high';
                      if (isHighOrPinned) return true;
                      return note.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
                             note.text.toLowerCase().includes(noteSearchQuery.toLowerCase());
                    });
                    const sortedNotes = [...filteredNotes].sort((a, b) => {
                      const aHighOrPinned = !!a.pinned || a.priority === 'high';
                      const bHighOrPinned = !!b.pinned || b.priority === 'high';
                      if (aHighOrPinned && !bHighOrPinned) return -1;
                      if (!aHighOrPinned && bHighOrPinned) return 1;
                      
                      // Secondary sort: pinned notes first, then high-priority notes, then normal notes
                      if (a.pinned && !b.pinned) return -1;
                      if (!a.pinned && b.pinned) return 1;
                      if (a.priority === 'high' && b.priority !== 'high') return -1;
                      if (a.priority !== 'high' && b.priority === 'high') return 1;

                      return b.timestamp - a.timestamp;
                    });

                    if (sortedNotes.length > 0) {
                      return (
                        <AnimatePresence initial={false} mode="popLayout">
                          {sortedNotes.map(note => {
                            const priorityColor = 
                              note.priority === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                              note.priority === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                              'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]';

                            const wordCount = note.text.trim() === '' ? 0 : note.text.trim().split(/\s+/).length;
                            const charCount = note.text.length;

                            return (
                              <motion.div 
                                key={note.id}
                                layoutId={note.id}
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className={`flex items-center justify-between p-2 rounded-xl border border-solid transition-all group ${
                                  note.pinned
                                    ? isLight
                                      ? 'bg-amber-50/50 border-amber-200 shadow-sm'
                                      : 'bg-amber-500/5 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]'
                                    : isLight 
                                      ? 'bg-slate-50 border-slate-100 hover:border-slate-200' 
                                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer" onClick={() => {
                                  setSelectedNoteId(note.id);
                                  setNewNoteTitle(note.title);
                                  setNewNoteText(note.text);
                                  setNewNotePriority(note.priority);
                                  setNewNotePinned(!!note.pinned);
                                  setActiveNoteTab('create');
                                }}>
                                  {/* Priority badge dot */}
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColor}`} title={`Priority: ${note.priority}`}></span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1 min-w-0">
                                      <div className={`text-[10px] font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{note.title}</div>
                                      {note.pinned && (
                                        <i className="fa-solid fa-thumbtack text-amber-500 text-[7px] shrink-0 animate-bounce" title="Pinned Note"></i>
                                      )}
                                    </div>
                                    <div className={`text-[8px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{note.text}</div>
                                    
                                    {/* Small non-obtrusive word/character count indicator footer */}
                                    <div className="flex items-center justify-between text-[6.5px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                                      <span>{getNoteRelativeTime(note.timestamp)}</span>
                                      <span>{charCount} ch • {wordCount} w</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action icons */}
                                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                  {/* Pin toggle button */}
                                  <button
                                    onClick={(e) => handleTogglePinNote(note.id, e)}
                                    className={`w-5 h-5 rounded flex items-center justify-center text-[9px] border border-solid transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      note.pinned
                                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-500'
                                        : isLight 
                                          ? 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-200' 
                                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                    }`}
                                    title={note.pinned ? "Unpin Note" : "Pin Note"}
                                  >
                                    <i className={`fa-solid fa-thumbtack text-[8px] ${note.pinned ? '' : 'rotate-45 text-slate-400'}`}></i>
                                  </button>

                                  {/* Export button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const exportedDoc = {
                                        id: `doc-${Date.now()}`,
                                        title: note.title || 'Exported Note',
                                        content: note.text,
                                        updatedAt: Date.now()
                                      };
                                      saveWordDocument(exportedDoc);
                                      onEnter(AppMode.WORD);
                                      setTimeout(() => {
                                        window.dispatchEvent(new CustomEvent('cosmic-open-document', {
                                          detail: { id: exportedDoc.id, type: 'word' }
                                        }));
                                      }, 150);
                                    }}
                                    className={`w-5 h-5 rounded flex items-center justify-center text-[9px] border border-solid transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      isLight 
                                        ? 'bg-cyan-50 border-cyan-100 hover:border-cyan-200 text-cyan-600 hover:bg-cyan-100' 
                                        : 'bg-cyan-500/10 border-cyan-500/10 hover:border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                                    }`}
                                    title="Export to Cosmic Word"
                                  >
                                    <i className="fa-solid fa-file-export"></i>
                                  </button>

                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteQuickNote(note.id);
                                    }}
                                    className={`w-5 h-5 rounded flex items-center justify-center text-[9px] border border-solid transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      isLight 
                                        ? 'bg-red-50 border-red-100 hover:border-red-200 text-red-600 hover:bg-red-100' 
                                        : 'bg-red-500/10 border-red-500/10 hover:border-red-500/30 text-red-400 hover:bg-red-500/20'
                                    }`}
                                    title="Delete Note"
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      );
                    } else {
                      return (
                        <div className="text-center py-4 text-[9px] font-mono uppercase text-slate-500 tracking-wider">
                          {noteSearchQuery ? 'No matching notes' : 'No notes captured yet'}
                        </div>
                      );
                    }
                  })()}
                </div>
              </>
            ) : (
              <>
                {/* Create/Edit Tab Header */}
                <div className={`flex items-center justify-between border-b pb-1.5 mb-1.5 ${
                  isLight ? 'border-slate-100' : 'border-white/5'
                }`}>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 flex items-center gap-1.5">
                    <i className="fa-solid fa-pen-to-square text-cyan-500"></i>
                    {selectedNoteId ? 'Edit Mini-Note' : 'Create Mini-Note'}
                  </h3>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Dictation Indicator in Form */}
                    {isSpeechSupported && (
                      <button
                        onClick={isListening ? stopSpeechDictation : startSpeechDictation}
                        className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider border border-solid transition-all cursor-pointer flex items-center gap-1 ${
                          isListening 
                            ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse font-extrabold shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
                            : isLight
                              ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                              : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-white'
                        }`}
                        title={isListening ? "Listening: click to stop hands-free voice dictation" : "Voice dictation (Hands-Free)"}
                      >
                        <i className={`fa-solid ${isListening ? 'fa-microphone-slash text-red-500' : 'fa-microphone'}`}></i>
                        {isListening ? 'Dictating' : 'Dictate'}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        stopSpeechDictation();
                        setActiveNoteTab('list');
                      }}
                      className="text-white/40 hover:text-white text-[9px] font-mono tracking-widest uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="flex-1 flex flex-col space-y-1.5 min-h-0">
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note Title..."
                    className={`text-[10px] font-bold px-2 py-1 rounded bg-transparent focus:outline-none focus:bg-white/[0.02] border border-transparent focus:border-white/5 ${
                      isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-white placeholder:text-white/20'
                    }`}
                  />
                  <div className="relative flex-1 min-h-0">
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Note description content..."
                      className={`w-full h-full text-[10px] font-mono p-2 rounded bg-black/10 resize-none focus:outline-none focus:bg-black/20 border border-transparent focus:border-white/5 custom-scrollbar leading-normal ${
                        isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-slate-200 placeholder:text-white/20'
                      }`}
                    />
                    {isListening && (
                      <span className="absolute bottom-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" title="Mic active"></span>
                      </span>
                    )}
                  </div>
                  
                  {/* Priority and Save row */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Priority select dots */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(['low', 'medium', 'high'] as const).map(p => {
                        const isSelected = newNotePriority === p;
                        const dotColor = 
                          p === 'high' ? 'bg-rose-500' :
                          p === 'medium' ? 'bg-amber-500' :
                          'bg-cyan-500';

                        return (
                          <button
                            key={p}
                            onClick={() => setNewNotePriority(p)}
                            className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase font-bold tracking-wider border border-solid transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? p === 'high' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 font-extrabold' :
                                  p === 'medium' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 font-extrabold' :
                                  'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 font-extrabold'
                                : 'bg-transparent border-white/5 text-slate-500 hover:text-white'
                            }`}
                          >
                            <span className={`w-1 h-1 rounded-full ${dotColor}`}></span>
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pin option in creator */}
                    <button
                      onClick={() => setNewNotePinned(!newNotePinned)}
                      className={`px-1.5 py-0.5 rounded text-[7px] font-mono uppercase font-bold tracking-wider border border-solid transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        newNotePinned
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 font-extrabold'
                          : 'bg-transparent border-white/5 text-slate-500 hover:text-white'
                      }`}
                      title={newNotePinned ? "Note will stay pinned at the top" : "Pin this note to the top"}
                    >
                      <i className={`fa-solid fa-thumbtack ${newNotePinned ? '' : 'rotate-45'}`}></i>
                      Pin
                    </button>

                    {/* Character/Word count footer indicator & Save Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[7px] font-mono text-slate-500">
                        {newNoteText.length} ch • {newNoteText.trim() === '' ? 0 : newNoteText.trim().split(/\s+/).length} w
                      </span>

                      <button
                        onClick={() => {
                          stopSpeechDictation();
                          handleSaveQuickNote(newNoteText, newNoteTitle, newNotePriority, newNotePinned);
                        }}
                        disabled={!newNoteText.trim()}
                        className={`px-3 py-1 text-[8px] font-mono font-bold uppercase rounded-lg border border-solid transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                          isLight
                            ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500 shadow-md'
                            : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/30 text-cyan-400 hover:text-white'
                        }`}
                      >
                        <i className="fas fa-save mr-1"></i> Save
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Focus Session Timer Panel */}
          <div className={`border rounded-[1.8rem] p-5 shadow-2xl flex flex-col h-[200px] transition-all duration-300 ${
            isFocusActive 
              ? (isLight 
                  ? 'bg-indigo-50/90 border-indigo-200 text-indigo-900 shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-pulse'
                  : 'bg-indigo-950/40 border-indigo-500/30 text-white backdrop-blur-xl shadow-[0_0_25px_rgba(99,102,241,0.2)]')
              : (isLight 
                  ? 'bg-white border-slate-200 text-slate-800' 
                  : isColourful
                    ? 'bg-gradient-to-br from-fuchsia-950/40 via-purple-950/40 to-cyan-950/40 border-pink-500/20 text-white backdrop-blur-2xl shadow-[0_0_20px_rgba(219,39,119,0.15)]'
                    : 'bg-slate-900/60 border-white/10 text-white backdrop-blur-xl')
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 mb-2 ${
              isLight ? 'border-indigo-100' : 'border-white/5'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cyan-500 flex items-center gap-2">
                <i className="fa-solid fa-clock text-cyan-500"></i>
                Focus Session Timer
              </h3>
              {isFocusActive && (
                <span className="text-[8px] font-mono font-bold text-red-400 uppercase tracking-widest flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  DND Active
                </span>
              )}
            </div>

            {isFocusActive ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-3xl font-mono font-bold tracking-wider mb-1 text-indigo-400 animate-pulse">
                  {Math.floor(focusTimeLeft / 60)}:{(focusTimeLeft % 60).toString().padStart(2, '0')}
                </div>
                <p className="text-xs font-mono font-semibold truncate max-w-[220px] mb-1 text-indigo-200">
                  "{focusLabel || 'Deep Work'}"
                </p>
                <p className="text-[9px] font-mono opacity-60 uppercase mb-3 text-slate-400">Concentrating deeply...</p>
                <button
                  onClick={cancelFocusSession}
                  className="px-4 py-1.5 text-[9px] font-mono font-bold uppercase text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all rounded-full cursor-pointer border border-white/10"
                >
                  <i className="fas fa-stop mr-1"></i> End Session
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={focusLabel}
                      onChange={(e) => setFocusLabel(e.target.value)}
                      placeholder="Enter focus goal (e.g., Coding, Writing)..."
                      className={`w-full border rounded-xl px-2.5 py-1 text-[10px] focus:outline-none font-mono ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500' 
                          : 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] font-mono opacity-50 uppercase mb-1.5">Select Duration Preset:</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[15, 25, 45, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => setFocusDuration(mins)}
                        className={`py-1 text-[10px] font-mono font-bold rounded-lg border border-solid transition-all cursor-pointer ${
                          focusDuration === mins
                            ? (isLight 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                : 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]')
                            : (isLight 
                                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' 
                                : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/5')
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-solid border-white/5">
                  <div className="text-[8px] font-mono opacity-50">
                    TODAY: {focusLogs.filter(log => new Date(log.timestamp).toDateString() === new Date().toDateString()).length} SESS ({focusLogs.filter(log => new Date(log.timestamp).toDateString() === new Date().toDateString()).reduce((acc, log) => acc + log.duration, 0)}m)
                  </div>
                  <button
                    onClick={startFocusSession}
                    className={`px-4 py-1.5 text-[9px] font-mono font-bold uppercase rounded-full transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                      isLight 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-cyan-500 hover:opacity-90 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    }`}
                  >
                    <i className="fas fa-play text-[8px]"></i> Start Focus
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clipboard Manager Panel */}
          <div className={`border rounded-[1.8rem] p-5 shadow-2xl flex flex-col h-[200px] transition-all duration-300 ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800' 
              : isColourful
                ? 'bg-gradient-to-br from-fuchsia-950/40 via-purple-950/40 to-cyan-950/40 border-pink-500/20 text-white backdrop-blur-2xl shadow-[0_0_20px_rgba(219,39,119,0.15)]'
                : 'bg-slate-900/60 border-white/10 text-white backdrop-blur-xl'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 mb-2 ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cyan-500 flex items-center gap-2">
                <i className="fa-solid fa-clipboard text-cyan-500"></i>
                Clipboard History
              </h3>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isLight ? 'bg-blue-100 text-blue-700' : 'bg-cyan-500/10 text-cyan-400'
              }`}>
                {clipboardItems.length} Clips
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
              {clipboardItems.length > 0 ? (
                [...clipboardItems].sort((a, b) => {
                  if (a.pinned && !b.pinned) return -1;
                  if (!a.pinned && b.pinned) return 1;
                  return b.timestamp - a.timestamp;
                }).map(item => (
                  <div
                    key={item.id}
                    className={`flex flex-col border rounded-xl p-2.5 transition-all text-left text-xs gap-1.5 relative group ${
                      isLight 
                        ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200' 
                        : item.pinned
                          ? 'bg-indigo-950/30 border-indigo-500/30 text-white hover:bg-indigo-950/45'
                          : 'bg-white/5 border-white/[0.05] text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                          item.source === 'word' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 
                          item.source === 'excel' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 
                          'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {item.source}
                        </span>
                        {item.pinned && (
                          <i className="fa-solid fa-thumbtack text-[9px] text-indigo-400" title="Pinned"></i>
                        )}
                      </div>
                      <span className="text-[8px] font-mono opacity-40">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="font-mono text-[10px] break-all line-clamp-2 opacity-85 select-all px-1">
                      {item.text}
                    </p>

                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      <button
                        onClick={() => handleTogglePinClipboardItem(item.id)}
                        className={`p-1 rounded text-[9px] hover:bg-white/10 transition-colors cursor-pointer ${
                          item.pinned ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
                        }`}
                        title={item.pinned ? "Unpin from top" : "Pin to top"}
                      >
                        <i className="fa-solid fa-thumbtack"></i>
                      </button>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(item.text);
                          window.dispatchEvent(new CustomEvent('cosmic-notification', {
                            detail: { title: 'Copied', message: 'Snippet copied back to your main clipboard!', type: 'success' }
                          }));
                        }}
                        className="p-1 rounded text-[9px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('cosmic-paste', { detail: { text: item.text } }));
                          window.dispatchEvent(new CustomEvent('cosmic-notification', {
                            detail: { title: 'Inserting', message: 'Dispatched custom-paste event for active cursor.', type: 'info' }
                          }));
                        }}
                        className="p-1 rounded text-[9px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                        title="Insert / Paste"
                      >
                        <i className="fa-solid fa-arrow-right-to-bracket"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClipboardItem(item.id)}
                        className="p-1 rounded text-[9px] text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`h-full flex items-center justify-center text-[10px] font-mono uppercase tracking-widest text-center py-4 ${
                  isLight ? 'text-slate-400' : 'text-white/20'
                }`}>
                  Clipboard is empty. Copy text in document editors to populate!
                </div>
              )}
            </div>
          </div>

          {/* System Resources Widget */}
          <div className={`border rounded-[1.8rem] p-5 shadow-2xl flex flex-col h-[200px] transition-all duration-300 relative overflow-hidden ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800 shadow-slate-100' 
              : isColourful
                ? 'bg-gradient-to-br from-fuchsia-950/40 via-purple-950/40 to-cyan-950/40 border-pink-500/20 text-white backdrop-blur-2xl shadow-[0_0_20px_rgba(219,39,119,0.15)]'
                : 'bg-slate-900/60 border-white/10 text-white backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]'
          }`}>
            {/* Top Border Glow for Premium Vibe */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500"></div>

            <div className={`flex items-center justify-between border-b pb-2 mb-2 ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cyan-500 flex items-center gap-2">
                <i className="fa-solid fa-gauge-high text-cyan-500 animate-pulse"></i>
                System Resource Monitors
              </h3>
              <button
                type="button"
                onClick={handleOptimizeSystem}
                disabled={isOptimizing}
                className={`text-[8px] font-mono uppercase tracking-wider px-2 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isOptimizing
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/80 hover:text-cyan-400'
                }`}
              >
                <i className={`fas ${isOptimizing ? 'fa-spinner animate-spin text-amber-400' : 'fa-bolt text-yellow-400'}`}></i>
                {isOptimizing ? 'Optimizing...' : 'Optimize'}
              </button>
            </div>

            {/* Dashboard Visualizations Grid */}
            <div className="flex-1 flex flex-col justify-between py-1 font-mono">
              {/* CPU Usage Row */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold font-sans">
                    <i className="fa-solid fa-microchip text-cyan-500 text-[11px] w-3.5 text-center"></i>
                    <span>CPU</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] opacity-80 font-mono">
                    <span className="text-cyan-400">{cpuTemp}°C</span>
                    <span>•</span>
                    <span>3.85 GHz</span>
                    <span>•</span>
                    <span className={`font-bold min-w-[28px] text-right ${isLight ? 'text-slate-800' : 'text-white'}`}>{cpuUsage}%</span>
                  </div>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700 ease-out" 
                    style={{ width: `${cpuUsage}%` }}
                  />
                </div>
              </div>

              {/* RAM Usage Row */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold font-sans">
                    <i className="fa-solid fa-memory text-indigo-400 text-[11px] w-3.5 text-center"></i>
                    <span>RAM</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] opacity-80 font-mono">
                    <span className="text-indigo-300">{((ramUsage / 100) * 16.0).toFixed(1)} / 16.0 GB</span>
                    <span>•</span>
                    <span>DDR5</span>
                    <span>•</span>
                    <span className={`font-bold min-w-[28px] text-right ${isLight ? 'text-slate-800' : 'text-white'}`}>{ramUsage}%</span>
                  </div>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700 ease-out" 
                    style={{ width: `${ramUsage}%` }}
                  />
                </div>
              </div>

              {/* GPU Usage Row */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold font-sans">
                    <i className="fa-solid fa-cube text-fuchsia-400 text-[11px] w-3.5 text-center"></i>
                    <span>GPU</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] opacity-80 font-mono">
                    <span className="text-fuchsia-400">{gpuClock} MHz</span>
                    <span>•</span>
                    <span>{Math.floor(gpuUsage * 0.5 + 25)}% Fan</span>
                    <span>•</span>
                    <span className={`font-bold min-w-[28px] text-right ${isLight ? 'text-slate-800' : 'text-white'}`}>{gpuUsage}%</span>
                  </div>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-600 transition-all duration-700 ease-out" 
                    style={{ width: `${gpuUsage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Left Recent Workspace Panel and Founding Architects at the bottom of Screen 3 */}
        <div className="w-full max-w-6xl flex justify-between items-center z-30 mt-4 shrink-0 px-4">
          {recentItems.length > 0 && (
            <div className="opacity-90 hover:opacity-100 transition-opacity">
              <div className={`border p-5 rounded-2xl relative overflow-hidden shadow-xl w-64 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/40 backdrop-blur-3xl border-white/10'
              }`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
                <h4 className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 border-b pb-1 flex items-center gap-1.5 ${
                  isLight ? 'text-slate-900 border-slate-200' : 'text-gradient border-white/5'
                }`}>
                  <i className="fa-solid fa-clock-rotate-left text-cyan-400"></i>
                  RECENT WORKSPACE
                </h4>
                <div className="flex flex-col gap-1.5 font-mono">
                  {recentItems.slice(0, 3).map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleOpenRecent(item)}
                      className={`text-left text-[9px] font-bold truncate px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-all hover:translate-x-1 cursor-pointer ${
                        isLight 
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900' 
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/80 hover:text-cyan-400'
                      }`}
                    >
                      <i className={`fas ${item.icon} ${item.color} text-[10px]`}></i>
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="opacity-90 hover:opacity-100 transition-opacity ml-auto">
            <div className={`border p-5 rounded-2xl relative overflow-hidden shadow-xl ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/40 backdrop-blur-3xl border-white/10'
            }`}>
              <div className="absolute top-0 left-0 w-full h-1 animate-rainbow-bg"></div>
              <h4 className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 border-b pb-1 ${
                isLight ? 'text-slate-900 border-slate-200' : 'text-gradient border-white/5'
              }`}>Founding Architects</h4>
              <div className="flex flex-col gap-y-0.5 font-mono text-[9px]">
                {developers.map(dev => (
                  <span key={dev} className={`font-bold transition-colors cursor-default ${
                    isLight ? 'text-slate-600 hover:text-blue-600' : 'text-white/80 hover:text-gradient'
                  }`}>{dev}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen 2 Part B: Apps & Diagnostics Grid (renders when activeScreenIndex === 1) */}
      <div className={`absolute inset-0 z-20 flex flex-col items-center justify-between p-8 transition-all duration-700 ease-in-out overflow-y-auto ${
        activeScreenIndex === 1 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      } ${
        isLight ? 'bg-slate-50/95 backdrop-blur-3xl text-slate-900' : 'bg-slate-950/90 backdrop-blur-3xl text-white'
      }`}>
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className={`absolute top-0 left-0 w-full h-full ${
            isLight ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]'
          }`}></div>
        </div>

        {/* Scroll Up Button to Clock Screen */}
        <button 
          onClick={() => setActiveScreenIndex(0)} 
          className={`absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 group transition-colors z-[60] select-none cursor-pointer ${
            isLight ? 'text-slate-500 hover:text-slate-800' : 'text-cyan-400/60 hover:text-cyan-400'
          }`}
        >
          <i className="fas fa-chevron-up text-xl group-hover:-translate-y-1 transition-transform animate-pulse"></i>
          <span className="text-[8px] font-mono tracking-[0.4em] uppercase font-black">Scroll Up to Clock Screen</span>
        </button>

        {/* Workspace Top Header displaying app name, date, and time left visible */}
        <div className="w-full max-w-5xl flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0 z-30 mt-12">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-black tracking-widest font-mono text-cyan-400 uppercase">
              QUANTINUM-Q WORKSPACE
            </span>
          </div>
          <div className="text-[10px] font-mono tracking-widest uppercase opacity-70">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(time)}
          </div>
        </div>

        {/* Search tool inside Screen 2 */}
        <div className="w-full max-w-2xl mb-6 relative z-30 flex items-center shrink-0">
          <i className={`fas fa-search absolute left-6 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}></i>
          <input 
             type="text"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search tools or history..."
             className={`w-full border rounded-full py-4 pl-14 pr-36 text-lg focus:outline-none focus:ring-1 backdrop-blur-xl transition-all font-sans ${
               isLight 
                 ? 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500' 
                 : 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/50'
             }`}
          />
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('cosmic-open-omnisearch', { detail: { query: searchQuery } }));
              window.dispatchEvent(new Event('cosmic-trigger-omnisearch'));
            }}
            className="absolute right-3 px-4 py-2 text-[10px] font-mono font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 active:scale-95 text-white rounded-full border border-white/10 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            title="Perform unified full-text index lookup"
          >
            Omni Search
          </button>
        </div>
        
        {/* Sub Apps 3x4 Paginated Grid Wrapper */}
        {(() => {
          const filteredApps = menuItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
          const ITEMS_PER_PAGE = 12;
          const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE);
          const currentPageApps = filteredApps.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

          return (
            <div className="w-full max-w-5xl flex flex-col items-center gap-4 relative z-30">
              <div className="w-full flex items-center justify-between gap-4">
                
                {/* Desktop Left Scroll Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="hidden md:flex w-12 h-12 rounded-full border border-white/10 items-center justify-center bg-white/5 text-white hover:bg-white/10 hover:border-white/30 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  title="Previous Screen"
                >
                  <i className="fas fa-arrow-left-long text-lg"></i>
                </button>

                {/* The 3x4 Grid (max 12 tools per page) */}
                <div className="flex-1">
                  {currentPageApps.length > 0 ? (
                    <div className="grid grid-cols-3 grid-rows-4 gap-3 md:gap-4 w-full h-[400px] md:h-[480px]">
                      {currentPageApps.map((item) => (
                        <button
                          key={item.mode}
                          onClick={() => handleItemClick(item.mode, item.isPremiumFeature)}
                          className={`group relative overflow-hidden rounded-2xl p-2.5 md:p-3.5 flex flex-col items-center justify-center gap-1.5 md:gap-2 bg-gradient-to-br ${item.color} transform transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 shadow-lg border border-white/10 h-full w-full`}
                        >
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                          
                          <div className="relative z-10 w-9 h-9 md:w-11 md:h-11 rounded-xl bg-black/30 flex items-center justify-center backdrop-blur-md group-hover:rotate-6 transition-transform shrink-0">
                            <i className={`fas ${item.icon} text-base md:text-lg text-white`}></i>
                          </div>
                          
                          <span className="relative z-10 text-white font-extrabold text-[10px] md:text-xs tracking-wider uppercase text-center drop-shadow-md truncate w-full px-1">
                            {item.label}
                          </span>
                          
                          {item.isPremiumFeature && !isPremium && (
                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md rounded-full p-1 md:p-1.5">
                              <i className="fas fa-lock text-yellow-400 text-[8px] md:text-[10px]"></i>
                            </div>
                          )}
                        </button>
                      ))}
                      
                      {/* Placeholders for maintaining strict 3*4 grid alignment */}
                      {Array.from({ length: Math.max(0, ITEMS_PER_PAGE - currentPageApps.length) }).map((_, index) => (
                        <div 
                          key={`placeholder-${index}`}
                          className="rounded-2xl border border-white/[0.03] bg-white/[0.01] h-full w-full flex items-center justify-center"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white/5"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-[400px] md:h-[480px] flex flex-col items-center justify-center text-center p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/40 border border-white/10">
                        <i className="fas fa-magnifying-glass text-2xl"></i>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">No Results Found</h3>
                      <p className="text-white/40 text-sm max-w-md">No tools or workspaces match "{searchQuery}".</p>
                    </div>
                  )}
                </div>

                {/* Desktop Right Scroll Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1 || totalPages <= 1}
                  className="hidden md:flex w-12 h-12 rounded-full border border-white/10 items-center justify-center bg-white/5 text-white hover:bg-white/10 hover:border-white/30 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  title="Next Screen"
                >
                  <i className="fas fa-arrow-right-long text-lg"></i>
                </button>

              </div>

              {/* Pagination Dots & Navigation bar */}
              {totalPages > 1 && (
                <div className="flex items-center gap-6 mt-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="flex w-9 h-9 rounded-full border border-white/10 items-center justify-center bg-white/5 text-white disabled:opacity-20 transition-all active:scale-95"
                    title="Previous Screen"
                  >
                    <i className="fas fa-chevron-left text-xs"></i>
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${i === currentPage ? 'w-6 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                        title={`Go to page ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="flex w-9 h-9 rounded-full border border-white/10 items-center justify-center bg-white/5 text-white disabled:opacity-20 transition-all active:scale-95"
                    title="Next Screen"
                  >
                    <i className="fas fa-chevron-right text-xs"></i>
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Real-time Custom Event System Logs Component */}
        <div className="w-full max-w-5xl mt-8 relative z-30 shrink-0">
          <SystemLogs themeMode={themeMode} />
        </div>

        {/* Scroll Down to Command Center Button */}
        <button 
          onClick={() => setActiveScreenIndex(2)} 
          className={`mt-6 mb-4 flex flex-col items-center gap-1 group transition-colors select-none cursor-pointer shrink-0 z-30 ${
            isLight ? 'text-slate-500 hover:text-slate-800' : 'text-cyan-400/60 hover:text-cyan-400'
          }`}
        >
          <span className="text-[8px] font-mono tracking-[0.3em] uppercase font-black">Scroll Down to Command Center</span>
          <i className="fas fa-chevron-down text-lg group-hover:translate-y-1 transition-transform animate-pulse"></i>
        </button>
      </div>

      {/* Promo Code Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
            <button 
              onClick={() => {
                setShowPromoModal(false);
                setPromoError('');
                setPromoCode('');
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-crown text-3xl text-yellow-500"></i>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Premium Access Required</h3>
              <p className="text-white/60 text-sm">Enter your promo code to unlock all premium cosmic features.</p>
            </div>

            <form onSubmit={handlePromoSubmit} className="flex flex-col gap-4">
              <div>
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter Promo Code"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:border-yellow-500/50 transition-colors"
                  autoFocus
                />
                {promoError && <p className="text-red-400 text-xs text-center mt-2">{promoError}</p>}
              </div>
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-orange-900/50"
              >
                Unlock Premium
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Radial Menu */}
      {radialMenuPos && (
        <div 
          className="fixed z-[200] w-64 h-64 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: radialMenuPos.x, top: radialMenuPos.y }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-full pointer-events-auto border border-white/20 animate-fade-in flex items-center justify-center">
            <div className="absolute w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <i className="fas fa-bolt text-yellow-400"></i>
            </div>
            {menuItems.slice(0, 6).map((item, i) => {
              const angle = (i * (360 / 6)) * (Math.PI / 180);
              const radius = 80;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <button
                  key={item.mode}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item.mode, item.isPremiumFeature);
                    setRadialMenuPos(null);
                  }}
                  className={`absolute w-12 h-12 -ml-6 -mt-6 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center shadow-lg hover:scale-125 transition-transform group pointer-events-auto border border-white/20`}
                  style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                >
                  <i className={`fas ${item.icon} text-white`}></i>
                  <span className="absolute -bottom-6 text-[10px] whitespace-nowrap font-bold text-white/80 group-hover:text-white bg-black/50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Recent Documents side panel */}
            <div 
              className={`absolute ${radialMenuPos.x > window.innerWidth - 240 ? '-left-56' : 'left-[140px]'} top-1/2 -translate-y-1/2 w-48 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 pointer-events-auto animate-fade-in`}
            >
              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-mono border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                <i className="fas fa-history"></i>
                Recent Documents
              </div>
              <div className="flex flex-col gap-1.5">
                {recentItems.length > 0 ? (
                  recentItems.map((doc, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRecent(doc);
                        setRadialMenuPos(null);
                      }}
                      className="text-left text-[11px] font-mono hover:text-cyan-400 text-white/80 truncate bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/5 flex items-center gap-2 transition-all hover:translate-x-1"
                    >
                      <i className={`fas ${doc.icon} ${doc.color}`}></i>
                      <span className="truncate">{doc.title}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-[10px] text-white/30 text-center py-2 font-mono uppercase">
                    No recent files
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Go to Lock Screen / House Button at Top Left */}
      {activeScreenIndex > 0 && (
        <button
          onClick={() => setActiveScreenIndex(0)}
          className={`fixed top-6 left-6 z-50 flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 cursor-pointer shadow-lg hover:scale-110 group ${
            isLight
              ? 'bg-white/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white shadow-slate-200/50'
              : 'bg-slate-900/80 backdrop-blur-md border-white/10 text-cyan-400 hover:text-cyan-300 hover:bg-slate-900 shadow-black/40'
          }`}
          title="Go to Lock Screen"
        >
          <i className="fa-solid fa-house text-sm group-hover:scale-110 transition-transform"></i>
        </button>
      )}

      {/* Floating Pagination Dot Indicator on the Right Margin */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            onClick={() => setActiveScreenIndex(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
              activeScreenIndex === idx 
                ? 'bg-cyan-400 scale-125 shadow-[0_0_12px_rgba(34,211,238,0.8)]' 
                : 'bg-white/20 hover:bg-white/50 hover:scale-110'
            }`}
            title={`Go to Screen ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
