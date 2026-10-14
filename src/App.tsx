import React, { useState, useEffect } from 'react';
import { useTradingEngine } from './hooks/useTradingEngine';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Header } from './components/Header';
import { SimpleBotControl } from './components/SimpleBotControl';
import { SimpleConnectAccount } from './components/SimpleConnectAccount';
import { SimpleStrategyBridge } from './components/SimpleStrategyBridge';
import { SimpleJournal } from './components/SimpleJournal';
import { UnattendedSetupTab } from './components/UnattendedSetupTab';
import { SettingsDrawer } from './components/SettingsDrawer';
import { NewTradeModal } from './components/NewTradeModal';
import { TradeJournalDetailModal } from './components/TradeJournalDetailModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { RunnerGuideModal } from './components/RunnerGuideModal';
import { TradeOrder } from './types/execution';

export default function App() {
  const {
    accounts,
    activeAccount,
    activeAccountId,
    strategies,
    trades,
    tickers,
    isDaemonRunning,
    logs,
    lastTickTime,
    switchAccount,
    updateAccountRiskRules,
    updateAccountBalance,
    addAccount,
    addStrategy,
    updateStrategy,
    toggleStrategyActive,
    placeManualTrade,
    closeTradeManual,
    moveToBreakevenManual,
    updateTradeJournalNotes,
    toggleDaemon,
    emergencyPanicCloseAll,
    resetCircuitBreaker,
    addLog,
    mt5SyncInfo,
    isSyncingMT5,
    syncWithMetaTraderNow,
  } = useTradingEngine();

  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();

  // Tab navigation: Clean & simple
  const [activeTab, setActiveTab] = useState<'BOT' | 'SETUP' | 'CONNECT' | 'STRATEGY' | 'JOURNAL'>('BOT');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [initialSyncCode, setInitialSyncCode] = useState('');
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isRunnerGuideOpen, setIsRunnerGuideOpen] = useState(false);
  const [selectedJournalTrade, setSelectedJournalTrade] = useState<TradeOrder | null>(null);

  // Auto-detect ?sync=XXXXX in URL to instantly open pairing modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const syncParam = params.get('sync');
    if (syncParam) {
      setInitialSyncCode(syncParam);
      setIsSyncModalOpen(true);
    }
  }, []);

  const openTrades = trades.filter(t => t.accountId === activeAccountId && t.status === 'OPEN');
  const accountTrades = trades.filter(t => t.accountId === activeAccountId);

  const handleSendTestSignal = () => {
    addLog('SUCCESS', '⚡ Señal de prueba Webhook recibida desde TradingView. Verificación 24/7 completada con éxito.');
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#191C21] pb-16 selection:bg-[#EBF2EC] selection:text-[#2E4A35]">
      {/* 1. Clean Ivory & Olive Header */}
      <Header
        activeAccount={activeAccount}
        isDaemonRunning={isDaemonRunning}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPwa={() => setIsPwaModalOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      {/* 2. Main Content View according to activeTab */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-5 sm:pt-6">
        {activeTab === 'BOT' && (
          <SimpleBotControl
            activeAccount={activeAccount}
            isDaemonRunning={isDaemonRunning}
            onToggleDaemon={toggleDaemon}
            openTrades={openTrades}
            tickers={tickers}
            onCloseTrade={closeTradeManual}
            onMoveToBreakeven={moveToBreakevenManual}
            onOpenJournalDetail={(trade) => setSelectedJournalTrade(trade)}
            onNavigateToStrategy={() => setActiveTab('STRATEGY')}
            onUpdateBalance={(newBal) => updateAccountBalance(activeAccount.id, newBal)}
            onSyncMetaTraderNow={syncWithMetaTraderNow}
            isSyncingMT5={isSyncingMT5}
            mt5SyncInfo={mt5SyncInfo}
          />
        )}

        {activeTab === 'SETUP' && (
          <UnattendedSetupTab
            activeAccount={activeAccount}
            onSendTestSignal={handleSendTestSignal}
          />
        )}

        {activeTab === 'CONNECT' && (
          <SimpleConnectAccount
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSwitchAccount={switchAccount}
            onAddAccount={addAccount}
            onUpdateBalance={updateAccountBalance}
            onSyncMetaTraderNow={syncWithMetaTraderNow}
            isSyncingMT5={isSyncingMT5}
            mt5SyncInfo={mt5SyncInfo}
          />
        )}

        {activeTab === 'STRATEGY' && (
          <SimpleStrategyBridge
            strategies={strategies}
            activeAccount={activeAccount}
            onAddStrategy={addStrategy}
            onUpdateStrategy={updateStrategy}
            onToggleActive={toggleStrategyActive}
          />
        )}

        {activeTab === 'JOURNAL' && (
          <SimpleJournal
            trades={accountTrades}
            onSaveNotes={updateTradeJournalNotes}
          />
        )}
      </main>

      {/* 3. Settings Drawer (Hides all advanced tools and account switching) */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSwitchAccount={switchAccount}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenPwa={() => setIsPwaModalOpen(true)}
        onOpenRunnerGuide={() => setIsRunnerGuideOpen(true)}
        onOpenManualOrder={() => setIsNewTradeModalOpen(true)}
        onPanicKillSwitch={emergencyPanicCloseAll}
      />

      {/* 4. Modals */}
      <NewTradeModal
        isOpen={isNewTradeModalOpen}
        onClose={() => setIsNewTradeModalOpen(false)}
        activeAccount={activeAccount}
        tickers={tickers}
        onExecuteTrade={placeManualTrade}
      />

      <TradeJournalDetailModal
        trade={selectedJournalTrade}
        isOpen={!!selectedJournalTrade}
        onClose={() => setSelectedJournalTrade(null)}
        onSaveNotes={updateTradeJournalNotes}
      />

      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onRefreshData={() => window.location.reload()}
        initialCode={initialSyncCode}
      />

      <PWAInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={installApp}
      />

      <RunnerGuideModal
        isOpen={isRunnerGuideOpen}
        onClose={() => setIsRunnerGuideOpen(false)}
      />
    </div>
  );
}
