
import Products from "../models/Products";
import { Request, Response } from "express";
import { response } from "../utils/responsehandler";
import Wishlist from "../models/Wishlist";
import logger from "../logger";  
import { asyncHandler } from "../utils/asyncHandler";
import AppError from "../utils/AppError";

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.id;
  const { productId } = req.body;

  logger.info("Adding product to wishlist", { userId, productId });

  const product = await Products.findOne({ _id: productId, isDeleted: false }).select("_id");
  if (!product) throw new AppError("Product not found", 404);

  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    logger.info("Creating wishlist", { userId });
    wishlist = new Wishlist({ user: userId, products: [] });
  }

  const alreadyExists = wishlist.products.some(id => id.toString() === productId);
  if (!alreadyExists) {
    wishlist.products.push(product._id);
    await wishlist.save();
    logger.info("Product added to wishlist", { userId, productId });
  }

  return response(res, 200, "Product added to wishlist", wishlist);
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.id;
  const { productId } = req.params;

  logger.info("Removing product from wishlist", { userId, productId });

  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) throw new AppError("Wishlist not found", 404);

  wishlist.products = wishlist.products.filter(item => item.toString() !== productId);
  await wishlist.save();

  logger.info("Product removed from wishlist", { userId, productId });
  return response(res, 200, "Product removed from wishlist", wishlist);
});


export const getWishlistByUser = asyncHandler(async (req:Request, res: Response) => {
  const userId = req.id;
  
  logger.info("Fetching wishlist", { userId });

 
   const wishlist = await Wishlist.findOne({ user: userId }).populate("products");
console.log(wishlist)
  if (!wishlist) throw new AppError("Wishlist is empty", 404);

  logger.info("Wishlist fetched successfully", { userId });
  return response(res, 200, "Wishlist fetched successfully", wishlist);
});

