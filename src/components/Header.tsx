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
  activeTab: 'BOT' | 'SETUP' | 'CONNECT' | 'STRATEGY' | 'JOURNAL';
  setActiveTab: (tab: 'BOT' | 'SETUP' | 'CONNECT' | 'STRATEGY' | 'JOURNAL') => void;
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
            <img 
              src="/icon.svg" 
              alt="EMS-MarketSense Bot" 
              className="w-8 h-8 rounded-lg shadow-sm border border-[#DDD8CD]" 
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-[#191C21] tracking-tight font-serif">
                EMS-MarketSense
              </span>
              <span className="text-[12px] text-[#575B62] font-serif italic hidden sm:inline">
                · Auto Trading Bot
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
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#EFECE4] border border-[#DDD8CD] text-xs text-[#2E4A35] hover:bg-[#EAE5DA] transition flex items-center gap-1 font-medium cursor-pointer"
              title="Instalar en tu móvil o PC"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">App Móvil</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-[#EFECE4] border border-[#DDD8CD] text-[#575B62] hover:text-[#191C21] hover:bg-[#EAE5DA] transition cursor-pointer"
              title="Ajustes y opciones avanzadas"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center justify-between border-t border-[#EAE5DA] pt-2 overflow-x-auto scrollbar-none">
          <div className="flex gap-1 sm:gap-2 w-full justify-between sm:justify-start">
            <button
              onClick={() => setActiveTab('BOT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'BOT'
                  ? 'bg-[#2D4734] text-[#F8F6F0] shadow-sm'
                  : 'text-[#575B62] hover:text-[#191C21] hover:bg-[#EFECE4]'
              }`}
            >
              🤖 Mi Bot
            </button>

            <button
              onClick={() => setActiveTab('SETUP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'SETUP'
                  ? 'bg-[#2D4734] text-[#F8F6F0] shadow-sm'
                  : 'text-[#575B62] hover:text-[#191C21] hover:bg-[#EFECE4]'
              }`}
            >
              ⚡ Piloto 24/7
            </button>

            <button
              onClick={() => setActiveTab('CONNECT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'CONNECT'
                  ? 'bg-[#2D4734] text-[#F8F6F0] shadow-sm'
                  : 'text-[#575B62] hover:text-[#191C21] hover:bg-[#EFECE4]'
              }`}
            >
              🔑 Conectar Cuenta
            </button>

            <button
              onClick={() => setActiveTab('STRATEGY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'STRATEGY'
                  ? 'bg-[#2D4734] text-[#F8F6F0] shadow-sm'
                  : 'text-[#575B62] hover:text-[#191C21] hover:bg-[#EFECE4]'
              }`}
            >
              📜 Estrategia
            </button>

            <button
              onClick={() => setActiveTab('JOURNAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
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
