import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import  AppError  from "../utils/AppError";

import { response } from "../utils/responsehandler";

interface JwtPayload {
  userId: string;
  role: "customer" | "seller" | "admin";
}

export const authenticatedUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.access_token;
    if (!token) throw new AppError("Not authenticated", 401);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload;
    const user = await User.findById(decoded.userId).select("_id role").lean();
    if (!user) throw new AppError("User not found", 404);

    req.id = decoded.userId;
    req.role = decoded.role;
    next();
  } catch {
    return response(res, 401, "Invalid or expired token");
  }
};

export const isAuthorized =
  (...roles: Array<"customer" | "seller" | "admin">) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.role)) throw new AppError("Access Denied", 403);
    next();
  };
