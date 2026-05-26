import { Request, Response, NextFunction } from 'express';

// ─── Custom Error Types ────────────────────────────────────────────────────

export class ApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

// ─── Error Handler Middleware ──────────────────────────────────────────────

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle multer errors
  if (err instanceof Error) {
    if (err.name === 'MulterError') {
      const multerErr = err as any;
      const message = 
        multerErr.code === 'LIMIT_FILE_SIZE' ? 'File size too large' :
        multerErr.code === 'LIMIT_PART_COUNT' ? 'Too many parts' :
        multerErr.code === 'LIMIT_FILE_COUNT' ? 'Too many files' :
        multerErr.message || 'File upload error';
      
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    if (err instanceof ApiError) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
      return;
    }

    // Default error response
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
    return;
  }

  // Unknown error type
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
