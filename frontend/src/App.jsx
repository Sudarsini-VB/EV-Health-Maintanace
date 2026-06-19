import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import Vehicles from './pages/Vehicles';
import Alerts from './pages/Alerts';
import Maintenance from './pages/Maintenance';
import Analytics from './pages/Analytics';
import Predict from './pages/Predict';

export default function App() {
  return (
    <HashRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/predict" element={<Predict />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
