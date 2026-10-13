import React from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Download, 
  Smartphone, 
  Power,
  ChevronDown,
  Layers
} from 'lucide-react';
import { TradingAccount } from '../types/execution';

interface HeaderProps {
  activeAccount: TradingAccount;
  isDaemonRunning: boolean;
  activeTab: 'BOT' | 'CONNECT' | 'STRATEGY' | 'JOURNAL';
  setActiveTab: (tab: 'BOT' | 'CONNECT' | 'STRATEGY' | 'JOURNAL') => void;
  onOpenSettings: () => void;
  onOpenPwa: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeAccount,
  isDaemonRunning,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenPwa,
}) => {
  return (
    <header className="border-b border-[#E7E2D8] bg-[#F8F6F0]/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        {/* Top bar: Brand + Account Summary + Settings Button */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#191C21] text-[#FBF9F4] flex items-center justify-center font-bold font-mono text-sm shadow-sm">
              MS
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-[#191C21] tracking-tight font-serif">
                MarketSense
              </span>
              <span className="text-[12px] text-[#575B62] font-serif italic hidden sm:inline">
                · Trading Autónomo
              </span>
            </div>
          </div>

          {/* Quick Account Pill & Settings Menu */}
          <div className="flex items-center gap-2">
            {/* Account pill */}
            <div 
              onClick={() => setActiveTab('CONNECT')}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE4] border border-[#DDD8CD] text-xs cursor-pointer hover:bg-[#EAE5DA] transition"
              title="Clic para cambiar o ver cuenta"
            >
              <span className={`w-2 h-2 rounded-full ${isDaemonRunning ? 'bg-[#2E4A35] ring-2 ring-[#2E4A35]/20 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-semibold text-[#191C21] max-w-[130px] sm:max-w-none truncate">
                {activeAccount.name}
              </span>
              <span className="font-mono text-[#2E4A35] font-bold hidden sm:inline">
                ${activeAccount.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* PWA Install shortcut button */}
            <button
              onClick={onOpenPwa}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#EFECE4] border border-[#DDD8CD] text-xs text-[#2E4A35] hover:bg-[#EAE5DA] transition flex items-center gap-1 font-medium"
              title="Instalar en tu móvil o PC"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">App Móvil</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-[#EFECE4] border border-[#DDD8CD] text-[#575B62] hover:text-[#191C21] hover:bg-[#EAE5DA] transition"
              title="Ajustes y opciones avanzadas"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Clean Navigation Tabs */}
        <nav className="flex items-center justify-between border-t border-[#EAE5DA] pt-2">
          <div className="flex gap-1 sm:gap-2 w-full justify-between sm:justify-start">
            <button
              onClick={() => setActiveTab('BOT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'BOT'
                  ? 'bg-[#2D4734] text-[#F8F6F0] shadow-sm'
                  : 'text-[#575B62] hover:text-[#191C21] hover:bg-[#EFECE4]'
              }`}
            >
              🤖 Mi Bot
            </button>

            <button
              onClick={() => setActiveTab('CONNECT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'CONNECT'
                  ? 'bg-[#2D4734] text-[#F8F6F0] shadow-sm'
                  : 'text-[#575B62] hover:text-[#191C21] hover:bg-[#EFECE4]'
              }`}
            >
              🔑 Conectar Cuenta
            </button>

            <button
              onClick={() => setActiveTab('STRATEGY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'STRATEGY'
                  ? 'bg-[#2D4734] text-[#F8F6F0] shadow-sm'
                  : 'text-[#575B62] hover:text-[#191C21] hover:bg-[#EFECE4]'
              }`}
            >
              📜 Estrategia MarketSense
            </button>

            <button
              onClick={() => setActiveTab('JOURNAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'JOURNAL'
                  ? 'bg-[#2D4734] text-[#F8F6F0] shadow-sm'
                  : 'text-[#575B62] hover:text-[#191C21] hover:bg-[#EFECE4]'
              }`}
            >
              📖 Diario
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
