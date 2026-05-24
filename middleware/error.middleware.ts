import {
  Request,
  Response,
  NextFunction,
} from "express";
import { ZodError } from "zod";
import logger from "../logger";
import AppError from "../utils/AppError";
import { response } from "../utils/responsehandler";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ZodError) {

  const errors =
    err.flatten().fieldErrors;

  const firstError =String(Object.values(errors).flat()[0]);

     

  return response(
    res,
    400,
    firstError || "Validation failed"
  );
}
  const statusCode =
    err.statusCode || 500;

  const message =
    err.message ||
    "Internal server error";


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