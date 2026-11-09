import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupAccountPage } from './pages/auth/SignupAccountPage';
import { SignupDonePage } from './pages/auth/SignupDonePage';
import { SignupTermsPage } from './pages/auth/SignupTermsPage';
import { AuthProvider, SignupProvider } from './state/AuthState';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 구독·대화·크레딧 화면도 이렇게 RequireAuth로 감싼다 (PRD 5-0) */}
          <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupProvider><Outlet /></SignupProvider>}>
            <Route index element={<SignupAccountPage />} />
            <Route path="terms" element={<SignupTermsPage />} />
            <Route path="done" element={<SignupDonePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
