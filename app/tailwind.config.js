/** 디자인 토큰. 값은 docs/design.md(Siempre 디자인 명세)와 Figma를 기준으로 한다. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#F375B4', soft: '#F7D0E4' }, // primary, primary/soft
        accent: '#D63F8C', // accent/text: 큰 강조 숫자에만 (흰 바탕 대비 4.2:1)
        lavender: '#EDE3ED', // bg/subtle, border/soft
        page: '#F5EDF1', // bg/page
        surface: '#FFFFFF',
        ink: { DEFAULT: '#1E1A22', sub: '#5E5563', muted: '#8A8090', placeholder: '#B5ADB9' },
        line: '#D9DCE3', // border/default
        danger: { DEFAULT: '#C92A2A', soft: '#FFE3E3' },
        success: '#1F6B3A',
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '20px', xl2: '22px' },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
    },
  },
  plugins: [],
};
