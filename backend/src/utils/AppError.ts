export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  unauthenticated: (msg = 'Unauthorized') => new AppError(401, 'UNAUTHENTICATED', msg),
  forbidden: (msg = 'Forbidden') => new AppError(403, 'FORBIDDEN', msg),
  notFound: (msg = 'Voucher not found') => new AppError(404, 'VOUCHER_NOT_FOUND', msg),
  validation: (msg: string, details?: unknown) => new AppError(422, 'VALIDATION_ERROR', msg, details),
  conflict: (code: string, msg: string) => new AppError(409, code, msg),
};
