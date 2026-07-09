
import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';
import { Table, Save, Download, Plus, Trash2, Calculator, Sparkles, Search, BarChart3, X, Users, Copy, FolderOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { io, Socket } from 'socket.io-client';
import { getExcelDocuments, saveExcelDocument, deleteExcelDocument, addClipboardItem, ExcelDocument } from '../services/documentStorage';
import { getSetting } from '../services/indexedDBCache';

const math = create(all);

interface CellData {
  value: string;
  formula: string;
}

export const CosmicExcel: React.FC = () => {
  const ROWS = 20;
  const COLS = 10;
  const colLabels = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));
  
  const [grid, setGrid] = useState<CellData[][]>(() => {
    return Array.from({ length: ROWS }, () => 
      Array.from({ length: COLS }, () => ({ value: '', formula: '' }))
    );
  });
  
  const [activeCell, setActiveCell] = useState<{ r: number, c: number } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectedUsers, setConnectedUsers] = useState(1);
  
  const [savedSheets, setSavedSheets] = useState<ExcelDocument[]>([]);
  const [sheetId, setSheetId] = useState<string>('');
  const [title, setTitle] = useState<string>('Finance Ledger');
  const [showSheetSelector, setShowSheetSelector] = useState(false);

  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    return (localStorage.getItem('quantinum_interface_density') as 'comfortable' | 'compact') || 'comfortable';
  });

  useEffect(() => {
    const handleDensityChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.density) {
        setDensity(customEvent.detail.density);
      }
    };
    window.addEventListener('cosmic-density-change', handleDensityChange);
    return () => window.removeEventListener('cosmic-density-change', handleDensityChange);
  }, []);

  // Initialize and load saved spreadsheets
  useEffect(() => {
    const sheets = getExcelDocuments();
    setSavedSheets(sheets);
    
    getSetting<any>('autosave_active_tool_state').then(autosave => {
      if (autosave && autosave.type === 'excel') {
        setSheetId(autosave.id);
        setTitle(autosave.title || 'Untitled Spreadsheet');
        setGrid(autosave.grid || []);
        
        window.dispatchEvent(new CustomEvent('cosmic-notification', {
          detail: {
            title: 'Auto-Recovery Active',
            message: `Workspace restored successfully! Unsaved sheet "${autosave.title || 'Untitled Spreadsheet'}" loaded.`,
            type: 'success'
          }
        }));
      } else if (sheets.length > 0) {
        setSheetId(sheets[0].id);
        setTitle(sheets[0].title);
        setGrid(sheets[0].grid);
      } else {
        const newId = 'sheet-' + Date.now();
        setSheetId(newId);
        setTitle('Finance Ledger');
        const newGrid = Array.from({ length: ROWS }, () => 
          Array.from({ length: COLS }, () => ({ value: '', formula: '' }))
        );
        setGrid(newGrid);
      }
    });
  }, []);

  // Auto-save spreadsheets to local storage
  useEffect(() => {
    if (!sheetId) return;
    const timeout = setTimeout(() => {
      saveExcelDocument({
        id: sheetId,
        title: title || 'Untitled Spreadsheet',
        grid: grid,
        updatedAt: Date.now()
      });
      setSavedSheets(getExcelDocuments());
    }, 800);
    return () => clearTimeout(timeout);
  }, [sheetId, title, grid]);

  // Listen for IndexedDB auto-save trigger
  useEffect(() => {
    const handleAutosaveRequest = () => {
      import('../services/indexedDBCache').then(({ saveSetting }) => {
        saveSetting('autosave_active_tool_state', {
          type: 'excel',
          id: sheetId,
          title: title || 'Untitled Spreadsheet',
          grid: grid,
          timestamp: Date.now()
        }).then(() => {
          window.dispatchEvent(new CustomEvent('cosmic-notification', {
            detail: {
              title: 'Auto-Save Synchronized',
              message: `Auto-saved "${title || 'Untitled Spreadsheet'}" to IndexedDB secure cache.`,
              type: 'success'
            }
          }));
          window.dispatchEvent(new CustomEvent('cosmic-health-api-call', {
            detail: { api: 'IndexedDB.saveSetting (Auto-save Excel)', status: 'Success' }
          }));
        });
      });
    };
    window.addEventListener('cosmic-request-autosave', handleAutosaveRequest);
    return () => window.removeEventListener('cosmic-request-autosave', handleAutosaveRequest);
  }, [sheetId, title, grid]);

  // Connect to WebSocket server based on active sheetId
  useEffect(() => {
    if (!sheetId) return;
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-spreadsheet', sheetId);
    });

    newSocket.on('spreadsheet-init', (data: CellData[][]) => {
      if (data && data.length > 0) {
        setGrid(data);
      }
    });

    newSocket.on('spreadsheet-updated', (data: CellData[][]) => {
      setGrid(data);
    });

    // Simple user count simulation based on socket events
    newSocket.on('user-joined', (count: number) => setConnectedUsers(count));
    newSocket.on('user-left', (count: number) => setConnectedUsers(count));

    return () => {
      newSocket.disconnect();
    };
  }, [sheetId]);

  // Listen for paste event from Clipboard Manager
  useEffect(() => {
    const handlePaste = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.text && activeCell) {
        const textToPaste = customEvent.detail.text;
        const newGrid = [...grid.map(row => [...row])];
        const { r, c } = activeCell;
        
        let formula = '';
        let value = '';
        if (textToPaste.startsWith('=')) {
          formula = textToPaste;
          value = evaluateFormula(textToPaste, newGrid);
        } else {
          formula = '';
          value = textToPaste;
        }

        newGrid[r][c] = { value, formula };
        setGrid(newGrid);
        setEditingValue(textToPaste);

        if (socket) {
          socket.emit('spreadsheet-update', { sheetId, cells: newGrid });
        }
      }
    };
    window.addEventListener('cosmic-paste', handlePaste);
    return () => window.removeEventListener('cosmic-paste', handlePaste);
  }, [activeCell, grid, socket, sheetId]);

  // Listen for global open document event (from Search results!)
  useEffect(() => {
    const handleOpenDoc = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.type === 'excel') {
        const sheets = getExcelDocuments();
        const found = sheets.find(s => s.id === customEvent.detail.id);
        if (found) {
          setSheetId(found.id);
          setTitle(found.title);
          setGrid(found.grid);
        }
      }
    };
    window.addEventListener('cosmic-open-document', handleOpenDoc);
    return () => window.removeEventListener('cosmic-open-document', handleOpenDoc);
  }, []);

  const generateChartData = () => {
    const data = grid.slice(0, 10).map((row, i) => ({
      name: row[0].value || `Row ${i + 1}`,
      value: parseFloat(row[1].value) || 0
    })).filter(item => item.value !== 0);
    setChartData(data);
    setShowChart(true);
  };

  const evaluateFormula = (formula: string, currentGrid: CellData[][]) => {
    if (!formula.startsWith('=')) return formula;
    
    try {
      let expression = formula.substring(1).toUpperCase();
      
      // Replace cell references (e.g., A1, B2) with their values
      expression = expression.replace(/([A-J])(\d+)/g, (match, col, row) => {
        const c = col.charCodeAt(0) - 65;
        const r = parseInt(row) - 1;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          const val = currentGrid[r][c].value;
          return val === '' ? '0' : val;
        }
        return '0';
      });

      const result = math.evaluate(expression);
      return result.toString();
    } catch (err) {
      return '#ERROR!';
    }
  };

  const handleCellClick = (r: number, c: number) => {
    setActiveCell({ r, c });
    setEditingValue(grid[r][c].formula || grid[r][c].value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };

  const handleBlur = () => {
    if (!activeCell) return;
    const { r, c } = activeCell;
    const newGrid = [...grid.map(row => [...row])];
    
    const isFormula = editingValue.startsWith('=');
    newGrid[r][c] = {
      formula: isFormula ? editingValue : '',
      value: isFormula ? evaluateFormula(editingValue, newGrid) : editingValue
    };

    // Recalculate all formulas in the grid to handle dependencies
    // Simple one-pass recalculation
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        if (newGrid[i][j].formula) {
          newGrid[i][j].value = evaluateFormula(newGrid[i][j].formula, newGrid);
        }
      }
    }

    setGrid(newGrid);
    if (socket) {
      socket.emit('spreadsheet-update', { sheetId: sheetId, cells: newGrid });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
      if (activeCell && activeCell.r < ROWS - 1) {
        handleCellClick(activeCell.r + 1, activeCell.c);
      }
    }
  };

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeCell]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-slate-800 font-sans overflow-hidden">
      {/* Ribbon */}
      <div className={`bg-emerald-700 text-white ${density === 'compact' ? 'py-0.5 text-[10px]' : 'py-1 text-[11px]'} flex items-center gap-4 font-medium px-4`}>
        <span className="opacity-60 hover:opacity-100 cursor-pointer px-2 py-1">File</span>
        <span className="border-b-2 border-white px-2 py-1">Home</span>
        <span className="opacity-60 hover:opacity-100 cursor-pointer px-2 py-1">Insert</span>
        <span className="opacity-60 hover:opacity-100 cursor-pointer px-2 py-1">Formulas</span>
        <span className="opacity-60 hover:opacity-100 cursor-pointer px-2 py-1">Data</span>
      </div>

      <div className={`${density === 'compact' ? 'px-4 py-1.5' : 'px-6 py-3'} border-b border-slate-200 bg-slate-50 flex items-center justify-between shadow-sm z-40 relative`}>
        <div className="flex items-center gap-4">
          <div 
            className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100 cursor-pointer hover:scale-105 transition-all"
            onClick={() => setShowSheetSelector(!showSheetSelector)}
            title="Toggle Spreadsheets List"
          >
            <Table size={20} />
          </div>
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-sm text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-44 font-sans"
              />
              <button
                onClick={() => setShowSheetSelector(!showSheetSelector)}
                className={`p-1.5 rounded-lg transition-colors ${showSheetSelector ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-slate-100 text-slate-500'}`}
                title="Spreadsheet Manager"
              >
                <FolderOpen size={14} />
              </button>
            </div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Quantinum Spreadsheet Engine</p>

            {/* Floating Spreadsheets Selector */}
            {showSheetSelector && (
              <div className="absolute top-12 left-0 w-72 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-mono">Spreadsheet Manager</span>
                  <button onClick={() => setShowSheetSelector(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 custom-scrollbar">
                  {savedSheets.map(sheet => (
                    <div key={sheet.id} className={`flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all ${sheet.id === sheetId ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'hover:bg-stone-50 border-transparent text-slate-700'}`}>
                      <button
                        onClick={() => {
                          setSheetId(sheet.id);
                          setTitle(sheet.title);
                          setGrid(sheet.grid);
                          setShowSheetSelector(false);
                        }}
                        className="flex-1 text-left truncate text-xs font-bold font-sans"
                      >
                        {sheet.title}
                      </button>
                      {savedSheets.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteExcelDocument(sheet.id);
                            const updated = getExcelDocuments();
                            setSavedSheets(updated);
                            if (sheetId === sheet.id && updated.length > 0) {
                              setSheetId(updated[0].id);
                              setTitle(updated[0].title);
                              setGrid(updated[0].grid);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-100 transition-colors"
                          title="Delete Spreadsheet"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const newId = 'sheet-' + Date.now();
                    setSheetId(newId);
                    setTitle('Untitled Spreadsheet');
                    const newGrid = Array.from({ length: ROWS }, () => 
                      Array.from({ length: COLS }, () => ({ value: '', formula: '' }))
                    );
                    setGrid(newGrid);
                    setShowSheetSelector(false);
                  }}
                  className="w-full py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> NEW SPREADSHEET
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 mr-2">
            <Users size={14} />
            <span>{connectedUsers} Online</span>
          </div>
          <button 
            onClick={generateChartData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all"
          >
            <BarChart3 size={14} /> Chart
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all">
            <Download size={14} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 hover:scale-105 transition-all">
            <Save size={14} /> Save to Cloud
          </button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className={`${density === 'compact' ? 'px-3 py-1' : 'px-4 py-2'} border-b border-slate-200 bg-white flex items-center gap-4`}>
        <div className="flex items-center gap-2 text-slate-400 font-mono text-xs border-r border-slate-200 pr-4 w-16">
          <span className="font-bold text-emerald-600">
            {activeCell ? `${colLabels[activeCell.c]}${activeCell.r + 1}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 italic text-xs w-6">
          fx
        </div>
        <input 
          ref={inputRef}
          value={editingValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-mono"
          placeholder="Enter value or formula (e.g. =A1+B1)"
        />
        {activeCell && (
          <button 
            onClick={async () => {
              const cell = grid[activeCell.r][activeCell.c];
              const textToCopy = cell.formula || cell.value;
              if (textToCopy) {
                await navigator.clipboard.writeText(textToCopy);
                addClipboardItem(textToCopy, 'excel');
              }
            }}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-all flex items-center gap-1.5 text-xs font-bold font-sans hover:scale-[1.02]"
            title="Copy cell value/formula"
          >
            <Copy size={13} />
            Copy Cell
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-slate-100">
        <table className="border-collapse bg-white">
          <thead>
            <tr>
              <th className="w-10 bg-slate-50 border border-slate-200 sticky top-0 left-0 z-30"></th>
              {colLabels.map(label => (
                <th key={label} className="w-32 bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-400 py-1 sticky top-0 z-20">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                <td className="bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-400 text-center sticky left-0 z-10">
                  {r + 1}
                </td>
                {row.map((cell, c) => {
                  const isActive = activeCell?.r === r && activeCell?.c === c;
                  return (
                    <td 
                      key={c}
                      onClick={() => handleCellClick(r, c)}
                      className={`border border-slate-200 cursor-cell transition-all ${
                        density === 'compact' ? 'px-1.5 py-0.5 text-xs min-w-[110px] h-7' : 'px-3 py-2 text-sm min-w-[128px] h-10'
                      } ${
                        isActive ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/30' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate font-mono">
                        {cell.value}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-1.5 border-t border-slate-200 bg-white flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span className="text-emerald-600">Ready</span>
          <div className="h-3 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-2 hover:text-slate-600 cursor-pointer">
            <Plus size={10} /> New Sheet
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>Average: 0</span>
          <span>Count: 0</span>
          <span>Sum: 0</span>
        </div>
      </div>

      {/* Chart Modal */}
      {showChart && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl h-[600px] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Data Visualization</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Quantinum Analytics Engine</p>
              </div>
              <button 
                onClick={() => setShowChart(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="flex-1 p-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="value" fill="#059669" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowChart(false)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
