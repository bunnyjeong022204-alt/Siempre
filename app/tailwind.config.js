/** 디자인 토큰. 값은 docs/design.md와 Figma를 기준으로 한다. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#F375B4', soft: '#F7D0E4' },
        lavender: '#EDE3ED',
        surface: '#FFFFFF',
        ink: { DEFAULT: '#1E1A22', sub: '#5E5563' },
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '20px' },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
    },
  },
  plugins: [],
};
