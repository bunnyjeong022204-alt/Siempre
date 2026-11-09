import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ChatPage } from './pages/ChatPage';
import { CreditsPage } from './pages/CreditsPage';
import { PlansPage } from './pages/PlansPage';
import { AppStateProvider } from './state/AppState';

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
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}
