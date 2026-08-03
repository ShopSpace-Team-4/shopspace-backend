// Base class every custom exception extends.
// Carries an HTTP status code so the global error middleware knows what to send back.
export class AppException extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean; // true = expected error (safe to show message to client)

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
