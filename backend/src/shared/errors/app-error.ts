export interface ValidationDetail {
  path: string;
  message: string;
  code: string;
}

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: ValidationDetail[];
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public details?: ValidationDetail[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}
