import * as React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useLiveStore } from '../../store/live-store';
import { TradingDashboard } from '../../features/dashboard/TradingDashboard';
import { AnalyticsPage } from '../../pages/analytics/AnalyticsPage';
import { TimeMachinePage } from '../../pages/timemachine/TimeMachinePage';

const PAGE_MAP: Record<string, React.FC> = {
  dashboard: TradingDashboard,
  analytics: AnalyticsPage,
  replay: TimeMachinePage,
};

export const MainLayout: React.FC = () => {
  const activeTab = useLiveStore((state) => state.activeTab);
  const Page = PAGE_MAP[activeTab] ?? TradingDashboard;

  return (
    <div className="flex h-screen w-full bg-black text-zinc-100 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-hidden relative">
          <Page />
        </main>
      </div>
    </div>
  );
};
