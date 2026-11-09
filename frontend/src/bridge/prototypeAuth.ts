// 권희수 님 화면(siempre-figma-prototype.html)과 김형민 로그인을 잇는 연결 스크립트.
// 그 HTML은 고치지 않고, 이 파일을 불러오는 <script> 한 줄만 넣는다.
//
// 하는 일
// 1. 로그인 확인 중에는 화면을 가린다 (로그인 안 한 사람에게 화면이 잠깐 보이지 않게)
// 2. 로그인하지 않았으면 /login?next=<이 페이지>로 보낸다 (PRD 5-0)
// 3. Firebase 계정은 있는데 Siempre 가입을 끝내지 않았으면 /signup으로 보낸다
// 4. 상단바의 "도윤 님" 자리에 실제 닉네임을 넣고, 로그아웃 버튼을 붙인다

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ApiError, authApi, type User } from '../api/auth';
import { auth } from '../lib/firebase';

const HERE = window.location.pathname + window.location.search;
const goLogin = () => window.location.replace(`/login?next=${encodeURIComponent(HERE)}`);

const root = document.documentElement;
root.style.visibility = 'hidden';
const reveal = () => { root.style.visibility = ''; };

function showUser(user: User) {
  const box = document.querySelector<HTMLElement>('header .user');
  if (!box) return;
  const name = box.querySelector('span');
  if (name) name.textContent = `${user.nickname} 님`;
  const avatar = box.querySelector('.avatar');
  if (avatar) {
    avatar.textContent = Array.from(user.nickname)[0] ?? '';
    avatar.setAttribute('title', user.email);
    avatar.setAttribute('aria-label', `${user.nickname} (${user.email})`);
  }
  if (!box.querySelector('[data-auth-logout]')) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.authLogout = '';
    btn.textContent = '로그아웃';
    // 상단바 글자와 같은 크기, 누르는 영역 44px
    btn.style.cssText = 'min-height:44px;padding:0 12px;border-radius:999px;border:1px solid var(--line,#ece3ea);background:#fff;color:inherit;font-size:13px;font-weight:600';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      if (auth) await signOut(auth).catch(() => {});
      window.location.replace('/login');
    });
    box.appendChild(btn);
  }
}

if (!auth) {
  // Firebase 설정이 없으면 로그인 화면에서 안내한다
  goLogin();
} else {
  let first = true;
  onAuthStateChanged(auth, async (fu) => {
    if (!fu) {
      // 다른 탭에서 로그아웃한 경우도 여기로 온다
      goLogin();
      return;
    }
    try {
      const { user } = await authApi.me();
      showUser(user);
      if (first) reveal();
      first = false;
    } catch (e) {
      if (e instanceof ApiError && e.code === 'profile_missing') window.location.replace('/signup');
      else goLogin(); // 서버 연결 실패 등: 로그인 화면이 문제를 안내한다
    }
  });
}
