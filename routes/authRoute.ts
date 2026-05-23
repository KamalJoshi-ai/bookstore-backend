// routes/authRoutes.ts

import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";

import * as AuthController from "../controllers/AuthController";

import { authenticatedUser } from "../middleware/authMiddleware";
import { validate } from "../middleware/validator";
import { USER } from "../models/User";
import crypto from 'crypto'
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";
import redisClient from "../config/redis";
import { loginSchema, registerSchema } from "../validator/authValidator";

const router = Router();
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.get("/verify-email/:token", AuthController.verifyEmail);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password/:token", AuthController.resetPassword);
router.get("/logout", AuthController.logout);
router.get("/verify-auth", authenticatedUser, AuthController.checkUserAuth);
router.post("/refresh-token", AuthController.refreshAccessToken);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: process.env.FRONTEND_URL, session: false }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user)  res.status(401).send("Unauthorized");
      const user = req.user as USER, familyId = crypto.randomUUID();
      const accessToken = generateAccessToken(user), refreshToken = generateRefreshToken(user, familyId);
      const hashedRefreshToken = hashToken(refreshToken);

      await redisClient.set(`refresh:${hashedRefreshToken}`, JSON.stringify({ userId: user.id, familyId }), "PX", 7 * 24 * 60 * 60 * 1000);
      await redisClient.sadd(`family:${familyId}`, hashedRefreshToken);
      await redisClient.expire(`family:${familyId}`, 7 * 24 * 60 * 60);

      res.cookie("access_token", accessToken, {  httpOnly: true,
    secure: true,
    sameSite: "none",
     maxAge: 15 * 60 * 1000 });
      res.cookie("refresh_token", refreshToken, { httpOnly: true,
    secure: true,
    sameSite: "none",
     maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.redirect(process.env.FRONTEND_URL as string);
    } catch (error) { next(error); }
  }
);
export default router