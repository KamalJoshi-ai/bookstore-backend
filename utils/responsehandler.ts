import { Response } from "express";

export const response = (
  res: Response,
  status: number,
  message: string,
  data?: any
) => {
  return res.status(status).json({
    success: status >= 200 && status < 300,
    message,
    data: data ?? null,//  data: data ?? null, ?? safer than ||
  });
};
  