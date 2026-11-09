// 공통 오류 형식 (shared/README.md 2장)
//   실패: { "error": { "code": "invalid_email", "message": "...", ...추가 정보 } }
// message는 사용자에게 그대로 보여 줄 한국어 해요체 문장.

export class ApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export const badRequest = (code, message, extra) => new ApiError(400, code, message, extra);

export function errorBody(err) {
  return { error: { code: err.code, message: err.message, ...err.extra } };
}

export const serverError = () => new ApiError(500, 'server_error', '잠시 후 다시 시도해 주세요.');
