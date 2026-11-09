import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth';
import { GoToServicePage } from './pages/GoToServicePage';
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
          {/* 로그인했으면 서비스 화면(권희수 님 페이지)으로. 그 페이지는 bridge/prototypeAuth.ts가 로그인을 확인한다 (PRD 5-0) */}
          <Route path="/" element={<RequireAuth><GoToServicePage /></RequireAuth>} />
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
