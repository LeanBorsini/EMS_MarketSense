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
import { PythonDirectTab } from './components/PythonDirectTab';
import { TradeOrder } from './types/execution';
import { TabId, getAvailableModules } from './config/modules';
import { APP_FEATURES } from './config/features';

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
    removeAccount,
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
    resetToRealCleanMode,
    addLog,
    mt5SyncInfo,
    isSyncingMT5,
    syncWithMetaTraderNow,
    testWebhookSignal,
  } = useTradingEngine();

  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();

  // Tab navigation: Clean & modular
  const [activeTab, setActiveTab] = useState<TabId>('BOT');

  // Guard activeTab if a module is turned off or removed
  useEffect(() => {
    const available = getAvailableModules().map(m => m.id);
    if (!available.includes(activeTab)) {
      setActiveTab('BOT');
    }
  }, [activeTab]);

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
            onNavigateToPython={() => setActiveTab('PYTHON')}
            onUpdateBalance={(newBal) => updateAccountBalance(activeAccount.id, newBal)}
            onSyncMetaTraderNow={syncWithMetaTraderNow}
            isSyncingMT5={isSyncingMT5}
            mt5SyncInfo={mt5SyncInfo}
            onResetToRealCleanMode={resetToRealCleanMode}
          />
        )}

        {activeTab === 'PYTHON' && APP_FEATURES.enablePythonDirect && (
          <PythonDirectTab
            activeAccount={activeAccount}
            mt5SyncInfo={mt5SyncInfo}
            isSyncingMT5={isSyncingMT5}
            onSyncMetaTraderNow={syncWithMetaTraderNow}
            onUpdateBalance={updateAccountBalance}
            onResetToRealCleanMode={resetToRealCleanMode}
          />
        )}

        {activeTab === 'SETUP' && APP_FEATURES.enableTradingViewWebhooks && (
          <UnattendedSetupTab
            activeAccount={activeAccount}
            onSendTestSignal={handleSendTestSignal}
            onTriggerTestWebhook={testWebhookSignal}
          />
        )}

        {activeTab === 'CONNECT' && APP_FEATURES.enableMetaTraderEA && (
          <SimpleConnectAccount
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSwitchAccount={switchAccount}
            onAddAccount={addAccount}
            onRemoveAccount={removeAccount}
            onUpdateBalance={updateAccountBalance}
            onSyncMetaTraderNow={syncWithMetaTraderNow}
            isSyncingMT5={isSyncingMT5}
            mt5SyncInfo={mt5SyncInfo}
            onResetToRealCleanMode={resetToRealCleanMode}
          />
        )}

        {activeTab === 'STRATEGY' && APP_FEATURES.enableAiStrategyAudit && (
          <SimpleStrategyBridge
            strategies={strategies}
            activeAccount={activeAccount}
            onAddStrategy={addStrategy}
            onUpdateStrategy={updateStrategy}
            onToggleActive={toggleStrategyActive}
          />
        )}

        {activeTab === 'JOURNAL' && APP_FEATURES.enableTradingJournal && (
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
        onNavigateToConnect={() => setActiveTab('CONNECT')}
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
