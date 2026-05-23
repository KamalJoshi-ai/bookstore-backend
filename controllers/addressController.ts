import { Request, Response } from "express";
import Address from "../models/Address";
import { response } from "../utils/responsehandler";
import User from "../models/User";
import { Types } from "mongoose";
import logger from "../logger";
import { asyncHandler } from "../utils/asyncHandler";
import AppError from "../utils/AppError";

export const createOrUpdateAddressByUserId = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.id;
  const { addressLine1, addressLine2, phoneNumber, city, state, pincode, addressId } = req.body;

  if (addressId) {
    const existingAddress = await Address.findById(addressId);
    if (!existingAddress) throw new AppError("Address not found", 404);
    if (existingAddress.user.toString() !== userId) throw new AppError("Unauthorized access", 403);

    Object.assign(existingAddress, { addressLine1, addressLine2, phoneNumber, city, state, pincode });
    await existingAddress.save();

    logger.info("Address updated", { userId, addressId });
    return response(res, 200, "Address updated successfully", existingAddress);
  }

  const newAddress = await Address.create({ user: userId, addressLine1, addressLine2, phoneNumber, city, state, pincode });
  await User.findByIdAndUpdate(userId, { $push: { addresses: newAddress._id } });

  logger.info("Address created", { userId, addressId: newAddress._id });
  return response(res, 201, "Address created successfully", newAddress);
});

export const getAddressByUserId = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await Address.find({ user: req.id }).sort({ createdAt: -1 });
  if (!addresses.length) throw new AppError("No addresses found", 404);

  logger.info("Addresses fetched", { userId: req.id });
  return response(res, 200, "Addresses fetched successfully", { addresses });
});

