/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { DashboardRouter } from './pages/DashboardRouter';
import { SystemBranches } from './pages/SystemBranches';
import { SystemUsers } from './pages/SystemUsers';
import { TillOperators } from './pages/TillOperators';
import React, { useEffect } from 'react';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <DashboardRouter />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/till-operators" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT', 'HEAD_ACCOUNTANT', 'DIRECTOR', 'AUDITOR', 'SUPERVISOR']}>
              <Layout>
                <TillOperators />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/branches" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT', 'HEAD_ACCOUNTANT', 'DIRECTOR', 'AUDITOR']}>
              <Layout>
                <SystemBranches />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
              <Layout>
                <SystemUsers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

