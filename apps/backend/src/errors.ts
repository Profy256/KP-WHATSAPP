/**
 * An error carrying the HTTP status it should be reported as.
 *
 * Without this every thrown error fell through to the catch-all handler as a
 * 500, so a client could not tell "this email is already registered" (retry
 * with a different one) from "the server broke" (retry the same request) —
 * which is exactly the distinction a signup form needs to make.
 */
export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'AppError';
  }
}
