import {
  Request,
  Response,
  NextFunction,
} from "express";

import logger from "../logger";
import AppError from "../utils/AppError";
import { response } from "../utils/responsehandler";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const statusCode =
    err.statusCode || 500;

  const message =
    err.message ||
    "Internal server error";

  // Log only unexpected errors
  if (!(err instanceof AppError)) {
    logger.error("Unexpected error", {
      message: err.message,
      path: req.path,
      method: req.method,
    });
  }

  return response(
    res,
    statusCode,
    message
  );
};