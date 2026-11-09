export const won = (n: number) => `₩${Math.round(n).toLocaleString('ko-KR')}`;
export const num = (n: number) => Math.round(n).toLocaleString('ko-KR');
export const credits = (n: number) => (n === 0 ? '무제한' : `${num(n)}크레딧`);
export const percent = (r: number) => `${Math.round(r * 100)}%`;
