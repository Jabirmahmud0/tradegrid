import { MainLayout } from './components/layout/MainLayout';
import { TradingDashboard } from './features/dashboard/TradingDashboard';

function App() {
  return (
    <MainLayout>
      <TradingDashboard />
    </MainLayout>
  );
}

export default App;
