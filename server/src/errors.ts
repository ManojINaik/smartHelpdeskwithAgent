export class AppError extends Error {
  status: number;
  code: string;
  details?: Record<string, any>;
  constructor(status: number, code: string, message: string, details?: Record<string, any>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: Record<string, any>) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized', details?: Record<string, any>) {
    super(401, 'UNAUTHORIZED', message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: Record<string, any>) {
    super(403, 'FORBIDDEN', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', details?: Record<string, any>) {
    super(404, 'NOT_FOUND', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: Record<string, any>) {
    super(409, 'CONFLICT', message, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests', details?: Record<string, any>) {
    super(429, 'RATE_LIMITED', message, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service failed', details?: Record<string, any>) {
    super(502, 'BAD_GATEWAY', message, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', details?: Record<string, any>) {
    super(503, 'SERVICE_UNAVAILABLE', message, details);
  }
}


