// 아주 작은 라우터. 각 파트는 register 함수 안에서 router.get/post로 자기 주소만 붙인다.

export function createRouter() {
  const routes = new Map();
  const add = (method) => (path, handler) => {
    const key = `${method} ${path}`;
    if (routes.has(key)) throw new Error(`라우트가 겹쳐요: ${key}`);
    routes.set(key, handler);
  };
  return {
    get: add('GET'),
    post: add('POST'),
    find: (method, path) => routes.get(`${method} ${path}`),
    list: () => [...routes.keys()],
  };
}
