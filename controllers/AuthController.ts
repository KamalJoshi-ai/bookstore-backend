import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User";

import { response } from "../utils/responsehandler";
import { sendVerificationToEmail, sendResetPasswordLinkToEmail } from "../config/emailConfig";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";
import logger from "../logger";
import redisClient from "../config/redis";
import { asyncHandler } from "../utils/asyncHandler";
import AppError from "../utils/AppError";
import { clearAuthCookies } from "../utils/cookies";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

interface TokenPayload {
  userId: string;
  role: string;
  familyId: string;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

function setAccessCookie(res: Response, token: string): void {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: ACCESS_TOKEN_TTL_MS,
  });
}

// ─── register ────────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, isSeller } = req.body;

  logger.info("Register attempt", { email, requestId: req.id });

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    logger.warn("Register failed - user already exists", { email, requestId: req.id });
    throw new AppError("User already exists", 409);
  }

  const plainToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(plainToken);

  const user = await User.create({
    name,
    email,
    password,
    role: isSeller ? "seller" : "customer",
    verificationToken: hashedToken,
    verificationTokenExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });

try {
  await sendVerificationToEmail(user.email, plainToken);
} catch (error) {
  logger.error("Verification email failed", {
    error,
    email: user.email,
    requestId: req.id,
  });
}
  logger.info("User registered successfully", {
    userId: user.id,
    email: user.email,
    role: user.role,
    requestId: req.id,
  });

  return response(res, 201, "Registration successful. Please verify your email.", {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
  });
});

// ─── verifyEmail ──────────────────────────────────────────────────────────────

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token;
 
  logger.info("Email verification attempt", { requestId: req.id, ip: req.ip });

  if (!token) {
    logger.warn("Verification failed - token missing", { requestId: req.id });
    throw new AppError("Verification token missing", 400);
  }

  const user = await User.findOne({
    verificationToken: hashToken(token as string),
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    logger.warn("Verification failed - invalid or expired token", { requestId: req.id });
    throw new AppError("Invalid or expired verification token", 401);
  }
  if (user.isVerified) {
    logger.warn("Verification failed - already verified", { userId: user.id, requestId: req.id });
    throw new AppError("User already verified", 400);
  }

  user.isVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpires = null;
  await user.save();

  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user, familyId);
  const hashedRefreshToken = hashToken(refreshToken);

  const multi = redisClient.multi();
  multi.set(
    `refresh:${hashedRefreshToken}`,
    JSON.stringify({ userId: user.id, familyId }),
    "PX",
    REFRESH_TOKEN_TTL_MS
  );
  multi.sadd(`family:${familyId}`, hashedRefreshToken);
  multi.expire(`family:${familyId}`, REFRESH_TOKEN_TTL_MS / 1000);
  await multi.exec();

  setRefreshCookie(res, refreshToken);
  setAccessCookie(res, accessToken);

  logger.info("Email verified successfully", { userId: user.id, email: user.email, requestId: req.id });

  return response(res, 200, "Email verified successfully", {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
    },
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  logger.info("Login attempt", { email, ip: req.ip, requestId: req.id });

  const user = await User.findOne({ email }).select("+password +verificationTokenExpires");
  if (!user) throw new AppError("Invalid email or password", 401);

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) throw new AppError("Invalid email or password", 401);

  if (!user.isVerified) {
    if (user.verificationTokenExpires && user.verificationTokenExpires.getTime() < Date.now()) {
      const plainToken = crypto.randomBytes(32).toString("hex");
      user.verificationToken = hashToken(plainToken);
      user.verificationTokenExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
      await user.save();
try {
  await sendVerificationToEmail(user.email, plainToken);
} catch (error) {
  logger.error("Verification email failed", {
    error,
    email: user.email,
    requestId: req.id,
  });
}
      throw new AppError("Verification link expired. A new verification email has been sent.", 403);
    }
    throw new AppError("Please verify your email first", 403);
  }

  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user, familyId);
  const hashedRefreshToken = hashToken(refreshToken);

  const multi = redisClient.multi();
  multi.set(
    `refresh:${hashedRefreshToken}`,
    JSON.stringify({ userId: user.id, familyId }),
    "PX",
    REFRESH_TOKEN_TTL_MS
  );
  multi.sadd(`family:${familyId}`, hashedRefreshToken);
  multi.expire(`family:${familyId}`, REFRESH_TOKEN_TTL_MS / 1000);
  await multi.exec();

  setRefreshCookie(res, refreshToken);
  setAccessCookie(res, accessToken);

  logger.info("User logged in successfully", { userId: user.id, email: user.email, requestId: req.id });

  return response(res, 200, "User logged in successfully", {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
    },
  });
});

// ─── refreshAccessToken ───────────────────────────────────────────────────────

export const refreshAccessToken = async (
  req: Request,
  res: Response
) => {
  try {

    const oldRefreshToken =
      req.cookies.refresh_token;
    if (!oldRefreshToken) {
      return response(
        res,
        401,
        "Refresh token missing"
      );
    }

    let decoded: TokenPayload;

    // VERIFY JWT
    try {

      decoded = jwt.verify(
        oldRefreshToken,
        process.env
          .REFRESH_TOKEN_SECRET as string
      ) as TokenPayload;

    } catch {

      logger.warn(
        `refreshAccessToken failed - invalid or tampered token`
      );

      return response(
        res,
        403,
        "Invalid or tampered refresh token"
      );
    }

    // HASH OLD TOKEN
    const hashedOldToken =
      hashToken(oldRefreshToken);

    // CHECK TOKEN EXISTS IN REDIS
    const existingToken =
      await redisClient.get(
        `refresh:${hashedOldToken}`
      );

    // REUSE DETECTED
    if (!existingToken) {
console.log(oldRefreshToken)
      logger.warn(
        `Refresh token reuse detected for family: ${decoded.familyId}`
      );

      
      // GET ALL TOKENS OF FAMILY
      const familyTokens =
        await redisClient.smembers(
          `family:${decoded.familyId}`
        );

      // DELETE ALL TOKENS
      for (const token of familyTokens) {

        await redisClient.del(
          `refresh:${token}`
        );
      }

      // DELETE FAMILY SET
      await redisClient.del(
        `family:${decoded.familyId}`
      );

      // CLEAR COOKIES
      res.clearCookie("refresh_token");
      res.clearCookie("access_token");

      return response(
        res,
        403,
        "Refresh token reuse detected. Please log in again."
      );
    }

    // DELETE OLD TOKEN (ROTATION)
    await redisClient.del(
      `refresh:${hashedOldToken}`
    );

    // REMOVE OLD TOKEN FROM FAMILY
    await redisClient.srem(
      `family:${decoded.familyId}`,
      hashedOldToken
    );

    // GENERATE NEW ACCESS TOKEN
    const newAccessToken =
      generateAccessToken({
        id: decoded.userId,
        role: decoded.role,
      } as any);

    // GENERATE NEW REFRESH TOKEN
    const newRefreshToken =
      generateRefreshToken(
        {
          id: decoded.userId,
          role: decoded.role,
        } as any,
        decoded.familyId
      );

    // HASH NEW TOKEN
    const hashedNewToken =
      hashToken(newRefreshToken);

    // STORE NEW TOKEN
    await redisClient.set(
      `refresh:${hashedNewToken}`,
      JSON.stringify({
        userId: decoded.userId,
        familyId: decoded.familyId,
      }),
              'PX',
         REFRESH_TOKEN_TTL_MS,
    );

    // ADD TO FAMILY SET
    await redisClient.sadd(
      `family:${decoded.familyId}`,
      hashedNewToken
    );

    // RESET FAMILY EXPIRY
    await redisClient.expire(
      `family:${decoded.familyId}`,
      REFRESH_TOKEN_TTL_MS / 1000
    );

    // SET COOKIES
    setRefreshCookie(
      res,
      newRefreshToken
    );

    setAccessCookie(
      res,
      newAccessToken
    );

    logger.info(
      `Tokens rotated for user: ${decoded.userId}`
    );

    return response(
      res,
      200,
      "Token refreshed",
      {
        accessToken:
          newAccessToken,
      }
    );

  } catch (error: any) {

    logger.error(
      `Error in refreshAccessToken: ${error.message}`,
      {
        stack: error.stack,
      }
    );

    return response(
      res,
      500,
      "Internal server error"
    );
  }
};
// export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
//   const oldRefreshToken = req.cookies.refresh_token;

//   if (!oldRefreshToken) {
//     throw new AppError("Refresh token missing", 401);
//   }

//   // 1. Verify the JWT signature and expiry
//   let decoded: TokenPayload;
//   try {
//     decoded = jwt.verify(
//       oldRefreshToken,
//       process.env.REFRESH_TOKEN_SECRET as string
//     ) as TokenPayload;
//   } catch {
//     throw new AppError("Invalid refresh token", 403);
//   }

//   const hashedOldToken = hashToken(oldRefreshToken);

//   // 2. Check that this exact token is still live in Redis
//   const tokenData = await redisClient.get(`refresh:${hashedOldToken}`);

//   // 3. Reuse detection — token was already rotated away; kill the whole family
//   if (!tokenData) {
//     logger.warn("Refresh token reuse detected — invalidating family", {
//       familyId: decoded.familyId,
//     });

//     const familyTokens = await redisClient.smembers(`family:${decoded.familyId}`);
//     const multi = redisClient.multi();
//     familyTokens.forEach((token:any) => multi.del(`refresh:${token}`));
//     multi.del(`family:${decoded.familyId}`);
//     await multi.exec();

//     clearAuthCookies(res);
//     throw new AppError("Session compromised. Please log in again.", 403);
//   }

//   // 4. Look up the user
//   const user = await User.findById(decoded.userId);
//   if (!user) {
//     throw new AppError("User not found", 404);
//   }

//   // 5. Generate the replacement token pair
//   const accessToken = generateAccessToken(user);
//   const newRefreshToken = generateRefreshToken(user, decoded.familyId);
//   const hashedNewToken = hashToken(newRefreshToken);

//   // 6. Atomically swap old token for new one and refresh the family TTL
//   const multi = redisClient.multi();
//   multi.del(`refresh:${hashedOldToken}`);
//   multi.srem(`family:${decoded.familyId}`, hashedOldToken);
//   multi.set(
//     `refresh:${hashedNewToken}`,
//     JSON.stringify({ userId: user.id, familyId: decoded.familyId }),  // consistent shape
//     "PX",
//     REFRESH_TOKEN_TTL_MS                                               // milliseconds, not seconds
//   );
//   multi.sadd(`family:${decoded.familyId}`, hashedNewToken);
//   multi.expire(`family:${decoded.familyId}`, REFRESH_TOKEN_TTL_MS / 1000); // reset TTL on family set
//   await multi.exec();

//   // 7. Push new cookies
//   setRefreshCookie(res, newRefreshToken);
//   setAccessCookie(res, accessToken);

//   logger.info("Access token refreshed successfully", { userId: user.id, requestId: req.id });

//   return response(res, 200, "Access token refreshed successfully", { accessToken });
// });

// ─── forgotPassword ───────────────────────────────────────────────────────────

// Wrapped with asyncHandler so unhandled rejections reach your global error handler
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) throw new AppError("Email is required", 400);

  logger.info("Forgot password request", { email, requestId: req.id });

  const user = await User.findOne({ email });

  // Deliberately vague response to prevent user enumeration
  if (!user) {
    logger.warn("Forgot password - email not found", { email, requestId: req.id });
    return response(res, 200, "If this email is registered, a reset link has been sent");
  }

  const plainToken = crypto.randomBytes(32).toString("hex"); // 32 bytes, consistent with others
  user.resetPasswordToken = hashToken(plainToken);
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  await sendResetPasswordLinkToEmail(user.email, plainToken);

  logger.info("Password reset link sent", { userId: user.id, requestId: req.id });
  return response(res, 200, "If this email is registered, a reset link has been sent");
});

// ─── resetPassword ────────────────────────────────────────────────────────────

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token;
  const { newPassword } = req.body;

  if (!token || !newPassword) throw new AppError("Token and new password are required", 400);

  const user = await User.findOne({
    resetPasswordToken: hashToken(token as string),
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    logger.warn("Invalid reset password token", { requestId: req.id, ip: req.ip });
    throw new AppError("Invalid or expired reset token", 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  logger.info("Password reset successful", { userId: user.id, requestId: req.id, ip: req.ip });

  return response(res, 200, "Password reset successfully");
});

// ─── logout ───────────────────────────────────────────────────────────────────

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (refreshToken) {
    const hashedToken = hashToken(refreshToken);
    const tokenData = await redisClient.get(`refresh:${hashedToken}`);

    const multi = redisClient.multi();
    multi.del(`refresh:${hashedToken}`);
    if (tokenData) {
      const parsed: { familyId: string } = JSON.parse(tokenData);
      multi.srem(`family:${parsed.familyId}`, hashedToken);
    }
    await multi.exec();
  }

  clearAuthCookies(res);
  logger.info("User logged out", { userId: req.id, requestId: req.id, ip: req.ip });
  return response(res, 200, "Logged out successfully");
});

// ─── checkUserAuth ────────────────────────────────────────────────────────────

export const checkUserAuth = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.id;

  if (!userId) {
    throw new AppError("Unauthenticated. Please log in to continue.", 403);
  }

  const user = await User.findById(userId).select(
    "-password -verificationToken -resetPasswordToken -resetPasswordExpires"
  );

  if (!user) {
    logger.error("checkUserAuth - user not found", { userId, requestId: req.id });
    throw new AppError("User not found", 404);
  }

  return response(res, 200, "User retrieved successfully", { user });
});