import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ReportDetail from './pages/ReportDetail';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/reports/:reportId" element={<ReportDetail />} />
      <Route path="*" element={<Navigate to="/reports/demo-report" replace />} />
    </Routes>
  );
};

export default App;
