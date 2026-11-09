import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ChatPage } from './pages/ChatPage';
import { CreditsPage } from './pages/CreditsPage';
import { PlansPage } from './pages/PlansPage';
import { SignupConsentPage } from './pages/signup/SignupConsentPage';
import { SignupDonePage } from './pages/signup/SignupDonePage';
import { SignupEntryPage } from './pages/signup/SignupEntryPage';
import { SignupInfoPage } from './pages/signup/SignupInfoPage';
import { SignupVerifyPage } from './pages/signup/SignupVerifyPage';
import { AppStateProvider } from './state/AppState';
import { SignupProvider } from './state/SignupState';

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<ChatPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/credits" element={<CreditsPage />} />
          </Route>
          {/* 회원가입은 GNB 없이 자체 상단바를 쓴다 */}
          <Route path="/signup" element={<SignupProvider><Outlet /></SignupProvider>}>
            <Route index element={<SignupEntryPage />} />
            <Route path="verify" element={<SignupVerifyPage />} />
            <Route path="info" element={<SignupInfoPage />} />
            <Route path="consent" element={<SignupConsentPage />} />
            <Route path="done" element={<SignupDonePage />} />
            <Route path="*" element={<Navigate to="/signup" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}
