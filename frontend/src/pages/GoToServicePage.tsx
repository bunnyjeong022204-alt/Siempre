import { useEffect } from 'react';
import { SERVICE_PAGE } from '../config/auth';

/** 로그인한 사람을 서비스 화면(권희수 님 페이지)으로 보낸다. RequireAuth 안에서만 쓴다. */
export function GoToServicePage() {
  useEffect(() => {
    window.location.replace(SERVICE_PAGE);
  }, []);
  return <p role="status" className="p-10 text-center text-sm text-ink-sub">서비스 화면으로 이동하고 있어요.</p>;
}
