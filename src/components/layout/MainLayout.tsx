import * as React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useLiveStore } from '../../store/live-store';
import { TradingDashboard } from '../../features/dashboard/TradingDashboard';
import { AnalyticsPage } from '../../pages/analytics/AnalyticsPage';
import { TimeMachinePage } from '../../pages/timemachine/TimeMachinePage';
import { StoragePage } from '../../pages/storage/StoragePage';
import { SecurityPage } from '../../pages/security/SecurityPage';

const PAGE_MAP: Record<string, React.FC> = {
  dashboard: TradingDashboard,
  analytics: AnalyticsPage,
  replay: TimeMachinePage,
  data: StoragePage,
  status: SecurityPage,
};

export const MainLayout: React.FC = () => {
  const activeTab = useLiveStore((state) => state.activeTab);
  const Page = PAGE_MAP[activeTab] ?? TradingDashboard;

  return (
    <div className="flex h-screen w-full bg-black text-zinc-100 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Skip Navigation Link for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)] focus:px-3 focus:py-2 focus:rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main id="main-content" className="flex-1 overflow-hidden relative" tabIndex={-1} role="main">
          <Page />
        </main>
      </div>
    </div>
  );
};
