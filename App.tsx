
import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ChatInterface } from './components/ChatInterface';
import { View, TaskMode, ThemeMode, AppState, AppMode } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VoiceNavigation } from './components/VoiceNavigation';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { getSetting, saveSetting } from './services/indexedDBCache';
import { CommandPalette } from './components/CommandPalette';
import { OmniSearchModal } from './components/OmniSearchModal';
import { StatusBar } from './components/StatusBar';
import { NotificationCenter, NotificationItem } from './components/NotificationCenter';
import { QuickActionsBar } from './components/QuickActionsBar';
import { DockAndTaskManager } from './components/DockAndTaskManager';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [initialTask, setInitialTask] = useState<TaskMode>(TaskMode.GENERAL);

  // Background Apps Tracking
  const [runningApps, setRunningApps] = useState<AppState[]>(() => {
    const stored = localStorage.getItem('quantinum_running_apps');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [appFrequencies, setAppFrequencies] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem('quantinum_app_frequencies');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return (parsed && typeof parsed === 'object') ? parsed : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  // Track app launching
  useEffect(() => {
    if (appState && appState !== 'HOME' && appState !== 'LOCK') {
      // Add to running apps
      setRunningApps(prev => {
        if (prev.includes(appState)) return prev;
        const next = [...prev, appState];
        localStorage.setItem('quantinum_running_apps', JSON.stringify(next));
        return next;
      });

      // Increment frequency
      setAppFrequencies(prev => {
        const next = { ...prev, [appState]: (prev[appState] || 0) + 1 };
        localStorage.setItem('quantinum_app_frequencies', JSON.stringify(next));
        return next;
      });
    }
  }, [appState]);

  const handleTerminateApp = (state: AppState) => {
    setRunningApps(prev => {
      const next = prev.filter(s => s !== state);
      localStorage.setItem('quantinum_running_apps', JSON.stringify(next));
      return next;
    });
    // If the active app is terminated, go back home
    if (appState === state) {
      setAppState('HOME');
    }
  };
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showOmniSearch, setShowOmniSearch] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('quantinum_premium') === 'true';
  });

  // Battery monitor state
  const [battery, setBattery] = useState<{ level: number; charging: boolean; supported: boolean }>({
    level: 0.85,
    charging: true,
    supported: false
  });

  // Quick Action Modes State
  const [dnd, setDnd] = useState(() => localStorage.getItem('quantinum_dnd') === 'true');
  const [readingMode, setReadingMode] = useState(() => localStorage.getItem('quantinum_reading') === 'true');
  const [batterySaver, setBatterySaver] = useState(() => localStorage.getItem('quantinum_battery_saver') === 'true');
  const [systemMute, setSystemMute] = useState(() => localStorage.getItem('quantinum_system_mute') === 'true');

  const handleToggleDnd = () => {
    const next = !dnd;
    setDnd(next);
    localStorage.setItem('quantinum_dnd', String(next));
    window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
      detail: { api: `QuickAction.toggleDnd (${next ? 'ON' : 'OFF'})`, status: 'Success' }
    }));
  };

  const handleToggleReadingMode = () => {
    const next = !readingMode;
    setReadingMode(next);
    localStorage.setItem('quantinum_reading', String(next));
    window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
      detail: { api: `QuickAction.toggleReading (${next ? 'ON' : 'OFF'})`, status: 'Success' }
    }));
  };

  const handleToggleBatterySaver = () => {
    const next = !batterySaver;
    setBatterySaver(next);
    localStorage.setItem('quantinum_battery_saver', String(next));
    window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
      detail: { api: `QuickAction.toggleBatterySaver (${next ? 'ON' : 'OFF'})`, status: 'Success' }
    }));
  };

  const handleToggleSystemMute = () => {
    const next = !systemMute;
    setSystemMute(next);
    localStorage.setItem('quantinum_system_mute', String(next));
    window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
      detail: { api: `QuickAction.toggleSystemMute (${next ? 'ON' : 'OFF'})`, status: 'Success' }
    }));
  };

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const stored = localStorage.getItem('quantinum_notifications');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback
      }
    }
    const defaultAlerts: NotificationItem[] = [
      {
        id: 'notif-1',
        title: 'Quantinum-Q OS Booted',
        message: 'System core services initialized in quantum container.',
        timestamp: Date.now() - 3600000,
        type: 'success',
        read: false
      },
      {
        id: 'notif-2',
        title: 'Power Grid Connected',
        message: 'Real-time battery monitor synched successfully with hardware grid.',
        timestamp: Date.now() - 1800000,
        type: 'info',
        read: false
      }
    ];
    localStorage.setItem('quantinum_notifications', JSON.stringify(defaultAlerts));
    return defaultAlerts;
  });

  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Real-time battery monitor using Battery Status API
  useEffect(() => {
    const updateBattery = (batt: any) => {
      setBattery({
        level: batt.level,
        charging: batt.charging,
        supported: true
      });
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        updateBattery(batt);
        const handleLevel = () => updateBattery(batt);
        const handleCharging = () => updateBattery(batt);
        
        batt.addEventListener('levelchange', handleLevel);
        batt.addEventListener('chargingchange', handleCharging);
        
        return () => {
          batt.removeEventListener('levelchange', handleLevel);
          batt.removeEventListener('chargingchange', handleCharging);
        };
      }).catch(() => {
        setBattery({ level: 0.82, charging: true, supported: false });
      });
    } else {
      setBattery({ level: 0.82, charging: true, supported: false });
    }
  }, []);

  // Sync notifications list with localStorage and custom notification event triggers
  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { title, message, type } = customEvent.detail;
        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: title || 'System Update',
          message: message || '',
          type: type || 'info',
          timestamp: Date.now(),
          read: false
        };
        
        setNotifications(prev => {
          const updated = [newNotif, ...prev];
          localStorage.setItem('quantinum_notifications', JSON.stringify(updated));
          return updated;
        });
      }
    };

    window.addEventListener('cosmic-notification', handleNewNotification);
    return () => window.removeEventListener('cosmic-notification', handleNewNotification);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('quantinum_theme');
    return (saved as ThemeMode) || ThemeMode.DARK;
  });

  const [customColors, setCustomColors] = useState<{primary: string, secondary: string, background: string}>(() => {
    const saved = localStorage.getItem('quantinum_custom_colors');
    return saved ? JSON.parse(saved) : { primary: '#6366f1', secondary: '#ec4899', background: '#0f172a' };
  });

  // Sync state with IndexedDB settings cache on startup
  useEffect(() => {
    getSetting<ThemeMode>('themeMode').then(cachedTheme => {
      if (cachedTheme) {
        setThemeMode(cachedTheme);
      }
    });

    getSetting<{primary: string, secondary: string, background: string}>('customColors').then(cachedColors => {
      if (cachedColors) {
        setCustomColors(cachedColors);
      }
    });

    getSetting<boolean>('isPremium').then(cachedPremium => {
      if (cachedPremium !== null) {
        setIsPremium(cachedPremium);
        localStorage.setItem('quantinum_premium', cachedPremium ? 'true' : 'false');
      }
    });

    getSetting<AppState>('last_active_appState').then(savedState => {
      if (savedState && savedState !== 'HOME') {
        getSetting<TaskMode>('last_active_initialTask').then(savedTask => {
          if (savedTask) {
            setInitialTask(savedTask);
          }
          setAppState(savedState);
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cosmic-notification', {
              detail: {
                title: 'Session Recovered',
                message: `Unexpected reload recovered: Returned to your active ${savedState.replace(/_/g, ' ')} workspace.`,
                type: 'success'
              }
            }));
          }, 800);
        });
      }
    });
  }, []);

  useEffect(() => {
    saveSetting('last_active_appState', appState);
    saveSetting('last_active_initialTask', initialTask);
  }, [appState, initialTask]);

  useEffect(() => {
    localStorage.setItem('quantinum_theme', themeMode);
    saveSetting('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('quantinum_custom_colors', JSON.stringify(customColors));
    saveSetting('customColors', customColors);
  }, [customColors]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Ctrl+K Command Palette trigger
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowPalette(prev => !prev);
        return;
      }

      // Ignore standard triggers if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          // Allow Escape to still work for closing things
          setShowShortcuts(false);
          setShowPalette(false);
        }
        return;
      }

      if (e.key === '?' && e.shiftKey) {
        setShowShortcuts(true);
      } else if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowPalette(false);
        setShowOmniSearch(false);
        setShowNotificationCenter(false);
      } else if (e.key === 'h' && e.ctrlKey) {
        e.preventDefault();
        navigateToHome();
      } else if (e.key === 't' && e.altKey) {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === 's' && e.altKey) {
        e.preventDefault();
        setShowOmniSearch(prev => !prev);
      } else if ((e.key === 'i' || e.key === 'I') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowNotificationCenter(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleToggleShortcuts = () => setShowShortcuts(prev => !prev);
    const handleCloseShortcuts = () => setShowShortcuts(false);
    const handleOpenShortcuts = () => setShowShortcuts(true);
    const handleTriggerSearch = () => setShowOmniSearch(true);
    const handleSetDnd = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.dnd !== undefined) {
        const next = !!customEvent.detail.dnd;
        setDnd(next);
        localStorage.setItem('quantinum_dnd', String(next));
        window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
          detail: { api: `QuickAction.toggleDnd (${next ? 'ON' : 'OFF'})`, status: 'Success' }
        }));
      }
    };
    const handleQuickActionSync = () => {
      setDnd(localStorage.getItem('quantinum_dnd') === 'true');
      setReadingMode(localStorage.getItem('quantinum_reading') === 'true');
      setBatterySaver(localStorage.getItem('quantinum_battery_saver') === 'true');
      setSystemMute(localStorage.getItem('quantinum_system_mute') === 'true');
    };
    window.addEventListener('toggle-shortcuts', handleToggleShortcuts);
    window.addEventListener('close-shortcuts', handleCloseShortcuts);
    window.addEventListener('open-shortcuts', handleOpenShortcuts);
    window.addEventListener('cosmic-trigger-omnisearch', handleTriggerSearch);
    window.addEventListener('cosmic-set-dnd', handleSetDnd);
    window.addEventListener('cosmic-quickaction-sync', handleQuickActionSync);
    return () => {
      window.removeEventListener('toggle-shortcuts', handleToggleShortcuts);
      window.removeEventListener('close-shortcuts', handleCloseShortcuts);
      window.removeEventListener('open-shortcuts', handleOpenShortcuts);
      window.removeEventListener('cosmic-trigger-omnisearch', handleTriggerSearch);
      window.removeEventListener('cosmic-set-dnd', handleSetDnd);
      window.removeEventListener('cosmic-quickaction-sync', handleQuickActionSync);
    };
  }, []);

  const handleUnlockPremium = () => {
    setIsPremium(true);
    localStorage.setItem('quantinum_premium', 'true');
    saveSetting('isPremium', true);
  };

  const toggleTheme = () => {
    setThemeMode(prev => {
      let next: ThemeMode;
      if (prev === ThemeMode.DARK) next = ThemeMode.LIGHT;
      else if (prev === ThemeMode.LIGHT) next = ThemeMode.COLORFUL;
      else next = ThemeMode.DARK;
      
      // Dispatch notification about theme change
      setTimeout(() => {
        const labels = {
          [ThemeMode.DARK]: 'DARK-BLACK',
          [ThemeMode.LIGHT]: 'LIGHT-WHITE',
          [ThemeMode.COLORFUL]: 'COLOURFUL-COLOURFUL',
          [ThemeMode.CUSTOM]: 'CUSTOM-THEME'
        };
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: {
            title: 'Theme Synchronized',
            message: `Active screen environment switched to: ${labels[next]}`,
            type: 'info'
          }
        }));
      }, 50);

      return next;
    });
  };

  // 30-Second Background Auto-Save Timer
  useEffect(() => {
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('cosmic-request-autosave'));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Alt + Scroll Wheel theme cycle shortcut
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        if (Math.abs(e.deltaY) > 20) {
          toggleTheme();
        }
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Touch gesture shortcuts (double-tap status bar / horizontal swipes in header)
  useEffect(() => {
    let lastTap = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const now = Date.now();
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        
        // Double tap top status bar / quick actions zone (y < 68px)
        if (now - lastTap < 300 && touchStartY < 68) {
          e.preventDefault();
          toggleTheme();
        }
        lastTap = now;

        // Horizontal swipe gesture in top header zone (y < 120px)
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 30 && touchStartY < 120) {
          toggleTheme();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Global Alarms Telemetry background checker
  const [ringingAlarm, setRingingAlarm] = useState<any>(null);
  useEffect(() => {
    let audioInterval: any = null;

    const playAlarmSound = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (e) {
        console.warn(e);
      }
    };

    const checker = setInterval(() => {
      const now = new Date();
      if (now.getSeconds() === 0) {
        try {
          const saved = localStorage.getItem('quantinum_alarms');
          const alarmsList = saved ? JSON.parse(saved) : [];
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const day = now.getDay();
          const isWeekday = day >= 1 && day <= 5;

          const triggered = alarmsList.find((alarm: any) => {
            if (!alarm.active) return false;
            if (alarm.hour !== currentHour || alarm.minute !== currentMinute) return false;
            if (alarm.repeat === 'weekdays' && !isWeekday) return false;
            return true;
          });

          if (triggered && !ringingAlarm) {
            setRingingAlarm(triggered);
            
            window.dispatchEvent(new CustomEvent('cosmic-notification', {
              detail: {
                title: `Alarm Triggered!`,
                message: `${triggered.label || 'Alarm alert'} (${triggered.hour.toString().padStart(2, '0')}:${triggered.minute.toString().padStart(2, '0')})`,
                type: 'warning'
              }
            }));

            playAlarmSound();
            audioInterval = setInterval(playAlarmSound, 1200);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, 1000);

    return () => {
      clearInterval(checker);
      if (audioInterval) clearInterval(audioInterval);
    };
  }, [ringingAlarm]);

  const dismissGlobalAlarm = () => {
    if (!ringingAlarm) return;
    try {
      const saved = localStorage.getItem('quantinum_alarms');
      if (saved) {
        let alarmsList = JSON.parse(saved);
        if (ringingAlarm.repeat === 'once') {
          alarmsList = alarmsList.map((a: any) => a.id === ringingAlarm.id ? { ...a, active: false } : a);
          localStorage.setItem('quantinum_alarms', JSON.stringify(alarmsList));
        }
      }
    } catch (e) {
      console.error(e);
    }
    setRingingAlarm(null);
  };

  const snoozeGlobalAlarm = () => {
    if (!ringingAlarm) return;
    try {
      const now = new Date();
      const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000);
      const snoozedAlarm = {
        id: `snooze-${Date.now()}`,
        hour: snoozeTime.getHours(),
        minute: snoozeTime.getMinutes(),
        label: `Snooze: ${ringingAlarm.label || 'Alarm'}`,
        active: true,
        repeat: 'once',
        snoozedCount: (ringingAlarm.snoozedCount || 0) + 1
      };
      const saved = localStorage.getItem('quantinum_alarms');
      const alarmsList = saved ? JSON.parse(saved) : [];
      alarmsList.push(snoozedAlarm);
      localStorage.setItem('quantinum_alarms', JSON.stringify(alarmsList));
      
      window.dispatchEvent(new CustomEvent('cosmic-notification', {
        detail: {
          title: 'Alarm Snoozed',
          message: `Snoozing "${ringingAlarm.label || 'Alarm'}" for 5 minutes.`,
          type: 'info'
        }
      }));
    } catch (e) {
      console.error(e);
    }
    setRingingAlarm(null);
  };

  const navigateToChat = (task: TaskMode = TaskMode.GENERAL) => {
    setInitialTask(task);
    setAppState('CHAT');
  };

  const navigateToHome = () => {
    setAppState('HOME');
  };

  const navigateToView = (state: AppState) => setAppState(state);

  const renderContent = () => {
    switch (appState) {
      case 'HOME':
        return (
          <HomeScreen 
            isPremium={isPremium}
            onUnlockPremium={handleUnlockPremium}
            themeMode={themeMode}
            onEnter={(mode: AppMode) => {
              switch (mode) {
                case AppMode.ORACLE: navigateToView('COSMIC_LINK'); break;
                case AppMode.IMAGE: navigateToView('IMAGE_GEN'); break;
                case AppMode.EDITOR: navigateToChat(TaskMode.GENERAL); break;
                case AppMode.EXCEL: navigateToView('COSMIC_EXCEL'); break;
                case AppMode.WORD: navigateToView('COSMIC_WORD'); break;
                case AppMode.POWER_POINT: navigateToView('COSMIC_POWER_POINT'); break;
                case AppMode.GAMES: navigateToView('GAMES'); break;
                case AppMode.PROJECT_MAKER: navigateToView('PROJECT_MAKER'); break;
                case AppMode.ARCHITECT: navigateToChat(TaskMode.GENERAL); break;
                case AppMode.PYTHON: navigateToView('PYTHON'); break;
                case AppMode.BANNER_CREATOR: navigateToView('BANNER_GEN'); break;
                case AppMode.COSMIC_CERTIFICATE: navigateToView('COSMIC_CERTIFICATE'); break;
                case AppMode.COUNTRY_INFORMER: navigateToView('COUNTRY_INTEL'); break;
                case AppMode.LOGO_INVENTOR: navigateToView('BANNER_GEN'); break;
                case AppMode.EXAM: navigateToView('QUESTION_PAPER'); break;
                case AppMode.DICTIONARY: navigateToView('DICTIONARY'); break;
                case AppMode.TRANSLATOR: navigateToView('TRANSLATOR'); break;
                case AppMode.VIDEO_GEN: navigateToView('VIDEO_GEN'); break;
                case AppMode.HISTORY: navigateToView('HISTORY'); break;
                case AppMode.THEMES: navigateToView('THEMES'); break;
                case AppMode.PERFORMANCE: navigateToView('PERFORMANCE'); break;
                case AppMode.COSMIC_WATCH: navigateToView('COSMIC_WATCH'); break;
              }
            }}
          />
        );
      default:
        const viewMap: Record<AppState, View> = {
          'CHAT': View.CHAT,
          'GAMES': View.GAME_ZONE,
          'TRANSLATOR': View.TRANSLATOR,
          'DICTIONARY': View.DICTIONARY,
          'COSMIC_POWER_POINT': View.COSMIC_POWER_POINT,
          'PLAYSTORE': View.PLAYSTORE,
          'COSMIC_LINK': View.COSMIC_LINK,
          'PROJECT_MAKER': View.PROJECT_MAKER,
          'YOUTUBE': View.YOUTUBE,
          'COUNTRY_INTEL': View.COUNTRY_INTEL,
          'QUESTION_PAPER': View.COSMIC_PAPER_GEN,
          'IMAGE_GEN': View.IMAGE_GEN,
          'VIDEO_GEN': View.VIDEO_GEN,
          'COSMIC_WATCH': View.COSMIC_WATCH,
          'COSMIC_WORD': View.COSMIC_WORD,
          'COSMIC_EXCEL': View.COSMIC_EXCEL,
          'HISTORY': View.HISTORY,
          'PYTHON': View.PYTHON,
          'BANNER_GEN': View.BANNER_GEN,
          'THEMES': View.THEMES,
          'PERFORMANCE': View.PERFORMANCE,
          'COSMIC_CERTIFICATE': View.COSMIC_CERTIFICATE,
          'LOCK': View.CHAT,
          'HOME': View.CHAT
        };
        const taskMap: Record<AppState, TaskMode> = {
          'CHAT': initialTask,
          'GAMES': TaskMode.GENERAL,
          'TRANSLATOR': TaskMode.TRANSLATOR,
          'DICTIONARY': TaskMode.DICTIONARY,
          'COSMIC_POWER_POINT': TaskMode.COSMIC_POWER_POINT,
          'PLAYSTORE': TaskMode.GENERAL,
          'COSMIC_LINK': TaskMode.GENERAL,
          'PROJECT_MAKER': TaskMode.GENERAL,
          'YOUTUBE': TaskMode.GENERAL,
          'COUNTRY_INTEL': TaskMode.COUNTRY_INTEL,
          'QUESTION_PAPER': TaskMode.COSMIC_PAPER_GEN,
          'IMAGE_GEN': TaskMode.IMAGE_GEN,
          'VIDEO_GEN': TaskMode.VIDEO_GEN,
          'COSMIC_WATCH': TaskMode.COSMIC_WATCH,
          'COSMIC_WORD': TaskMode.COSMIC_WORD,
          'COSMIC_EXCEL': TaskMode.COSMIC_EXCEL,
          'HISTORY': TaskMode.HISTORY,
          'PYTHON': TaskMode.PYTHON,
          'BANNER_GEN': TaskMode.BANNER_GEN,
          'THEMES': TaskMode.THEMES,
          'PERFORMANCE': TaskMode.PERFORMANCE,
          'COSMIC_CERTIFICATE': TaskMode.COSMIC_CERTIFICATE,
          'LOCK': TaskMode.GENERAL,
          'HOME': TaskMode.GENERAL
        };
        return (
          <ChatInterface 
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
            initialTask={taskMap[appState]} 
            initialView={viewMap[appState]} 
            onBackToHome={navigateToHome}
            customColors={customColors}
            setCustomColors={setCustomColors}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      {readingMode && <div className="cosmic-reading-overlay" />}
      <div 
        className={`min-h-screen transition-colors duration-500 pt-17 ${
          themeMode === ThemeMode.DARK ? 'bg-black text-white font-sans' : 
          themeMode === ThemeMode.LIGHT ? 'bg-white text-slate-900 font-sans' : 
          themeMode === ThemeMode.COLORFUL ? 'bg-gradient-to-br from-indigo-950 via-purple-900 via-pink-950 to-indigo-900 text-white font-sans animate-rainbow-bg' : 
          'text-white font-sans' // CUSTOM will use inline style
        } ${batterySaver ? 'cosmic-battery-saver-active' : ''}`}
        style={themeMode === ThemeMode.CUSTOM ? {
          background: `linear-gradient(to bottom right, ${customColors.background}, ${customColors.primary})`
        } : {}}
      >
        <StatusBar 
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
          isOnline={isOnline}
          unreadCount={notifications.filter(n => !n.read).length}
          onOpenNotifications={() => setShowNotificationCenter(true)}
          batteryLevel={battery.level}
          isCharging={battery.charging}
          batterySupported={battery.supported}
        />

        {/* Floating Go to Lock Screen / House Button at Top Left (Visible when inside any Sub-App) */}
        {appState !== 'HOME' && appState !== 'LOCK' && (
          <button
            id="global-floating-lock-btn"
            onClick={() => {
              setAppState('HOME');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('cosmic-lock-screen'));
              }, 50);
            }}
            className={`fixed top-12 left-6 z-[130] flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 cursor-pointer shadow-lg hover:scale-110 group ${
              themeMode === ThemeMode.LIGHT
                ? 'bg-white/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white shadow-slate-200/50'
                : 'bg-zinc-900/80 backdrop-blur-md border-white/10 text-cyan-400 hover:text-cyan-300 hover:bg-zinc-900 shadow-black/40'
            }`}
            title="Return to Lock Screen"
          >
            <i className="fa-solid fa-house text-sm group-hover:scale-110 transition-transform"></i>
          </button>
        )}

        <QuickActionsBar 
          themeMode={themeMode}
          dnd={dnd}
          onToggleDnd={handleToggleDnd}
          readingMode={readingMode}
          onToggleReadingMode={handleToggleReadingMode}
          batterySaver={batterySaver}
          onToggleBatterySaver={handleToggleBatterySaver}
          systemMute={systemMute}
          onToggleSystemMute={handleToggleSystemMute}
        />

        <NotificationCenter 
          isOpen={showNotificationCenter}
          onClose={() => setShowNotificationCenter(false)}
          notifications={notifications}
          onMarkAllRead={() => {
            const updated = notifications.map(n => ({ ...n, read: true }));
            setNotifications(updated);
            localStorage.setItem('quantinum_notifications', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('cosmic-notification', {
              detail: {
                title: 'System Alert Center',
                message: 'All notifications marked as read.',
                type: 'info'
              }
            }));
          }}
          onClearAll={() => {
            setNotifications([]);
            localStorage.removeItem('quantinum_notifications');
          }}
          onMarkRead={(id) => {
            const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
            setNotifications(updated);
            localStorage.setItem('quantinum_notifications', JSON.stringify(updated));
          }}
          themeMode={themeMode}
        />

        {renderContent()}
        <VoiceNavigation onNavigate={navigateToView} onNavigateHome={navigateToHome} />
        {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
        
        {ringingAlarm && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-[250] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-solid border-rose-500/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-pulse">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>
              
              <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-solid border-rose-500/30 flex items-center justify-center mx-auto mb-6 text-rose-500 animate-bounce">
                <i className="fas fa-bell text-3xl"></i>
              </div>

              <h3 className="text-rose-500 text-xs font-mono font-black tracking-[0.3em] uppercase mb-1">SYSTEM ALERT INTERRUPT</h3>
              <h2 className="text-white text-3xl font-black font-sans tracking-wide leading-tight mb-2 truncate">
                {ringingAlarm.label}
              </h2>
              <div className="text-white/60 font-mono text-lg tracking-widest font-black uppercase mb-6">
                At {ringingAlarm.hour.toString().padStart(2, '0')}:{ringingAlarm.minute.toString().padStart(2, '0')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={snoozeGlobalAlarm}
                  className="w-full py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest bg-zinc-900 border border-solid border-white/10 hover:bg-zinc-800 text-white transition-all cursor-pointer active:scale-95"
                >
                  Snooze (5m)
                </button>
                <button
                  onClick={dismissGlobalAlarm}
                  className="w-full py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest bg-rose-600 border border-solid border-rose-700 text-white hover:bg-rose-700 transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        <CommandPalette 
          isOpen={showPalette} 
          onClose={() => setShowPalette(false)} 
          onNavigate={(viewState) => navigateToView(viewState)}
          onNavigateHome={navigateToHome}
          onToggleTheme={toggleTheme}
          activeView={appState}
        />
        
        <OmniSearchModal 
          isOpen={showOmniSearch}
          onClose={() => setShowOmniSearch(false)}
          onNavigate={(viewState) => navigateToView(viewState)}
          themeMode={themeMode}
        />
        
        {!isOnline && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 px-5 py-2.5 bg-rose-950/90 backdrop-blur-md border border-rose-500/40 rounded-full shadow-2xl animate-pulse text-xs font-mono font-bold tracking-widest text-rose-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            OFFLINE MODE • PYODIDE PYTHON EDITOR & GAME ZONE HIGHLY ACTIVE
          </div>
        )}

        <DockAndTaskManager
          themeMode={themeMode}
          appState={appState}
          onNavigate={(state) => navigateToView(state)}
          onNavigateHome={navigateToHome}
          runningApps={runningApps}
          onTerminateApp={handleTerminateApp}
          appFrequencies={appFrequencies}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
