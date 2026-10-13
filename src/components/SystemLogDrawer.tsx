import React, { useState } from 'react';
import { 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  Activity, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Info
} from 'lucide-react';
import { DaemonLog } from '../types/execution';

interface SystemLogDrawerProps {
  logs: DaemonLog[];
  isDaemonRunning: boolean;
  lastTickTime: Date;
}

export const SystemLogDrawer: React.FC<SystemLogDrawerProps> = ({
  logs,
  isDaemonRunning,
  lastTickTime,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-[#090d16]/95 backdrop-blur-md transition-all">
      {/* Header bar / Click to expand */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors"
      >
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 font-mono">
            <span className={`w-2 h-2 rounded-full ${isDaemonRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-bold text-slate-300">Daemon 24/7 Terminal</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <span className="text-slate-400 hidden sm:inline font-mono text-[11px]">
            Último tick: {lastTickTime.toLocaleTimeString('es-ES')} (Latencia: 14ms)
          </span>

          <span className="text-slate-600 hidden md:inline">•</span>

          <span className="text-slate-400 hidden md:inline text-[11px] truncate max-w-xs lg:max-w-md">
            {logs[0]?.message || 'Sistema listo en escucha.'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-850 text-slate-400 border border-slate-800">
            {logs.length} eventos
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded Logs view */}
      {isOpen && (
        <div className="max-w-7xl mx-auto px-4 pb-4 pt-1 max-h-64 overflow-y-auto space-y-1.5 font-mono text-xs border-t border-slate-850">
          {logs.map(log => {
            const isSuccess = log.level === 'SUCCESS';
            const isWarn = log.level === 'WARN';
            const isError = log.level === 'ERROR';
            const isExec = log.level === 'EXECUTION';

            return (
              <div 
                key={log.id}
                className="flex items-start space-x-2 py-1 px-2 rounded hover:bg-slate-900/40 text-[11px]"
              >
                <span className="text-slate-500 flex-shrink-0">{log.timestamp}</span>

                <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] flex-shrink-0 ${
                  isSuccess ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' :
                  isWarn ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                  isError ? 'bg-red-950 text-red-400 border border-red-800/60' :
                  isExec ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {log.level}
                </span>

                {log.symbol && (
                  <span className="text-amber-400 font-bold flex-shrink-0">
                    [{log.symbol}]
                  </span>
                )}

                <span className={`leading-relaxed ${
                  isError ? 'text-red-300 font-semibold' :
                  isSuccess ? 'text-emerald-300' :
                  isWarn ? 'text-amber-200' :
                  isExec ? 'text-indigo-200' : 'text-slate-300'
                }`}>
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
