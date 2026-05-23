import jwt from "jsonwebtoken";
import { USER } from "../models/User";

type TokenPayload = {
  userId: string;
  role: "customer" | "seller" | "admin";
  familyId?:string
};

// ACCESS TOKEN
export const generateAccessToken = (
  user: USER
): string => {

  const payload: TokenPayload = {
    userId: user.id,
    role: user.role,
  };

  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: "15m",
    }
  );
};

export const generateRefreshToken = (
  user: USER,
  familyId: string
): string => {

  const payload: TokenPayload = {
    userId: user.id,
    role: user.role,
    familyId,
  };

  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: "7d",
    }
  );
};