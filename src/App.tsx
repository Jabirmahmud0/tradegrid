import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { TradingDashboard } from './features/dashboard/TradingDashboard';
import { LandingPage } from './features/landing/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Dashboard Shell */}
        <Route 
          path="/dashboard" 
          element={
            <MainLayout>
              <TradingDashboard />
            </MainLayout>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
