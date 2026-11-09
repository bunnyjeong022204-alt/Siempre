import { NavLink, Outlet } from 'react-router-dom';
import { useAppState } from '../../state/AppState';
import { num } from '../../lib/format';

const MENU = [
  { to: '/', label: '대화' },
  { to: '/plans', label: '구독 구성' },
  { to: '/credits', label: '크레딧' },
];

export function AppShell() {
  const { subscribed, balance, summary } = useAppState();
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-lavender px-5 py-3 md:px-20">
        <div className="flex items-center gap-2.5 text-lg font-bold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm">S</span>
          Siempre
        </div>
        <nav aria-label="주 메뉴" className="flex gap-1">
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end
              className={({ isActive }) => `inline-flex min-h-tap items-center rounded-full px-4 text-[15px] ${isActive ? 'bg-brand-soft font-semibold text-ink' : 'text-ink-sub'}`}>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <span className="text-sm text-ink-sub">
          {subscribed ? `이번 주 ${num(balance)} / ${num(summary.weeklyCredits)}크레딧` : '구독 전'}
        </span>
      </header>
      <Outlet />
    </div>
  );
}
