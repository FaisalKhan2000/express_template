import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from 'zod'
import { ErrorDetails } from "../types";
import APIError from "../utils/apiError.js";
import { errorLogger } from "../utils/logger.js";

const handleZodError = (res: Response, error: ZodError, path: string, requestId: string, ip: string): void => {
  const validationErrors = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code
  }));

  const currentTime = new Date().toISOString()
  const errorDetails: ErrorDetails = {
    code: "VALIDATION_ERROR",
    details: { validationErrors },
    source: path,
    timestamp: currentTime
  };

  const apiError = APIError.badRequest('Validation Error', errorDetails);
  handleAPIError(res, apiError, path, requestId, ip); // Add this line to handle the response
}

const handleAPIError = (res: Response, error: APIError, path: string, requestId: string, ip: string): void => {
  const response = {
    ...error.toJSON(),
    path,
    requestId,
    ip,
  };

  errorLogger.error('API Error', {
    ...error.errorDetails,
    path,
    requestId,
    ip,
    stack: error.stack
  });

  res.status(error.statusCode).json(response);
}

// Not Found middleware - should be used before error handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const apiError = APIError.notFound(`Route ${req.originalUrl} not found`);
  next(apiError);
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  const requestId = req.headers['x-request-id'] as string || Math.random().toString(36).substring(7)

  const forwardedFor = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || req.ip || req.connection.remoteAddress || 'unknown'

  const errorContext = {
    method: req.method,
    path: req.path,
    requestId,
    ip,
    query: req.query,
    body: req.body,
    headers: req.headers
  }

  try {
    if (error instanceof ZodError) {
      handleZodError(res, error, req.path, requestId, ip);
      return; // Add return statements after handling
    }

    if (error instanceof APIError) {
      handleAPIError(res, error, req.path, requestId, ip);
      return;
    }

    // Handle unknown errors
    errorLogger.error("Unhandled Error", {
      error: error.message,
      stack: error.stack,
      ...errorContext,
    });

    const internalError = APIError.internal(
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message,
      {
        code: "INTERNAL_ERROR",
        source: req.path,
        details: process.env.NODE_ENV === "development" ? error : undefined,
      }
    );
    handleAPIError(res, internalError, req.path, requestId, ip);
  } catch (handlingError) {
    // Fallback error handler
    errorLogger.error("Error Handler Failed", {
      originalError: error,
      handlingError,
      ...errorContext,
    });

    const fallbackError = APIError.internal("Internal Server Error", {
      code: "ERROR_HANDLER_FAILED",
      source: req.path,
      details: {
        originalError:
          process.env.NODE_ENV === "development" ? error : undefined,
        handlingError:
          process.env.NODE_ENV === "development" ? handlingError : undefined,
      },
    });
    handleAPIError(res, fallbackError, req.path, requestId, ip);
  }
}