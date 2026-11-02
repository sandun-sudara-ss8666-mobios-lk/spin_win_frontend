import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/login/LoginPage';
import { QrDisplayPage } from './pages/display/QrDisplayPage';
import { JoinRegistrationPage } from './pages/join/JoinRegistrationPage';
import { WheelDisplayPage } from './pages/display/WheelDisplayPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { OverviewPage } from './pages/admin/OverviewPage';
import { ExhibitionControlPage } from './pages/admin/ExhibitionControlPage';
import { MerchantsPage } from './pages/admin/MerchantsPage';
import { RewardsPage } from './pages/admin/RewardsPage';
import { DistributionPage } from './pages/admin/DistributionPage';
import { WheelDesignerPage } from './pages/admin/WheelDesignerPage';
import { PriorityRankingPage } from './pages/admin/PriorityRankingPage';
import { VisitorsPage } from './pages/admin/VisitorsPage';
import { AwardsPage } from './pages/admin/AwardsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join/:token" element={<JoinRegistrationPage />} />

        {/* Display Screens (Stall Kiosks) */}
        <Route path="/display/qr" element={<QrDisplayPage />} />
        <Route path="/display/wheel" element={<WheelDisplayPage />} />

        {/* Protected Administration Portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="exhibition" element={<ExhibitionControlPage />} />
          <Route path="merchants" element={<MerchantsPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="distribution" element={<DistributionPage />} />
          <Route path="wheel-designer" element={<WheelDesignerPage />} />
          <Route path="priority" element={<PriorityRankingPage />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="awards" element={<AwardsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Default route redirect to wheel stage */}
        <Route path="/" element={<Navigate to="/display/wheel" replace />} />
        <Route path="*" element={<Navigate to="/display/wheel" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};
