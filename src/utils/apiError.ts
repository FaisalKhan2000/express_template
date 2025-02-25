import { BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INTERNAL_SERVER_ERROR, HttpStatusCode } from "../constants/http.js";
import { ErrorDetails } from "../types";

class APIError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errorDetails: ErrorDetails;
  public readonly isOperational: boolean;

  constructor(statusCode: HttpStatusCode, message: string, errorDetails: ErrorDetails, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
    this.isOperational = isOperational;

    // capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  public toJSON() {
    return {
      error: {
        name: this.name, message: this.message, statusCode: this.statusCode, ...this.errorDetails, stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
      }
    }
  }
  public static badRequest(message: string, details: ErrorDetails = {}) {
    return new APIError(BAD_REQUEST, message, details);
  }

  public static unauthorized(message: string, details: ErrorDetails = {}) {
    return new APIError(UNAUTHORIZED, message, details);
  }

  public static forbidden(message: string, details: ErrorDetails = {}) {
    return new APIError(FORBIDDEN, message, details);
  }

  public static notFound(message: string, details: ErrorDetails = {}) {
    return new APIError(NOT_FOUND, message, details);
  }

  public static internal(message: string, details: ErrorDetails = {}) {
    return new APIError(INTERNAL_SERVER_ERROR, message, details, false);
  }
}

export default APIError;