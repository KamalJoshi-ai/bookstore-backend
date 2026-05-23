

import User from "../models/User";
import { Request, Response } from "express";
import { response } from "../utils/responsehandler";
import { uploadToCloudinary } from "../config/cloudinaryConfig";
import logger from "../logger"; 
import { asyncHandler } from "../utils/asyncHandler";
import AppError from "../utils/AppError";


export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      logger.warn("Update profile attempted without userId");
      return response(res, 400, "userId is required");
    }

    const { name, phoneNumber } = req.body;
    const updateData: any = { name, phoneNumber };
    if (req.file) {
      logger.info(`Uploading profile picture for user ${userId}`);
      const uploaded = await uploadToCloudinary(req.file.buffer);
      updateData.profilePicture = uploaded.secure_url;
      logger.info(`Profile picture uploaded: ${uploaded.secure_url}`);
    }

    const updateUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -verificationToken -resetPasswordToken -resetPasswordExpires");

    if (!updateUser) {
      logger.error(`User not found: ${userId}`);
      return response(res, 400, "User not found");
    }

    logger.info(`User profile updated successfully: ${userId}`);
    return response(res, 200, "User profile updated successfully", updateUser);
  } catch (error: any) {
    logger.error(`Error updating profile: ${error.message}`, { stack: error.stack });
    return response(res, 500, "Internal Server Error");
  }
};

export const becomeSeller = async (req: Request, res: Response) => {
  try {
    const userId = req.id;
    logger.info(`User ${userId} attempting to become seller`);

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "seller" },
      { new: true }
    ).select("-password -verificationToken -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      logger.error(`User not found: ${userId}`);
      return response(res, 404, "User not found");
    }

    logger.info(`User ${userId} is now a seller`);
    return response(res, 200, "You are now a seller!", user);
  } catch (error: any) {
    logger.error(`Error in becomeSeller: ${error.message}`, { stack: error.stack });
    return response(res, 500, "Internal Server Error");
  }
};