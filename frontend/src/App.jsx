// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ClientHome from './pages/ClientHome';
import AdminHome from './pages/AdminHome';
import StaffHome from './pages/StaffHome';
import FinanceHome from './pages/FinanceHome';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/client"
            element={
              <ProtectedRoute roles={['client']}>
                <ClientHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['administrator']}>
                <AdminHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute roles={['staff']}>
                <StaffHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute roles={['finance_officer']}>
                <FinanceHome />
              </ProtectedRoute>
            }
          />

          {/* Unknown paths → home */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}