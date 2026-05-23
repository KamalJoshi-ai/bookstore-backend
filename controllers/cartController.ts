import { response } from "../utils/responsehandler";
import Cart, { ICartItem } from "../models/CartItems";
import Products from "../models/Products";
import { Request, Response } from "express";
import mongoose from "mongoose";
import logger from "../logger";
import { asyncHandler } from "../utils/asyncHandler";
import AppError from "../utils/AppError";


export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.id, { productId, quantity } = req.body;

  const product = await Products.findOne({ _id: productId, isDeleted: false, isAvailable: true }).lean();
  if (!product) throw new AppError("Product not found", 404);
  if (product.quantity < 1) throw new AppError("Product out of stock", 400);
  if (product.seller.toString() === userId) throw new AppError("Cannot add own product", 403);

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [{ product: productId, quantity }] });
    logger.info("Cart created", { userId, productId, requestId: req.id });
    return response(res, 200, "Item added to cart", cart);
  }

  const existingItem = cart.items.find(item => item.product.toString() === productId);
  if (existingItem) {
    if (existingItem.quantity + quantity > product.quantity) throw new AppError(`Only ${product.quantity} available`, 400);
    existingItem.quantity += quantity;
  } else {
    if (quantity > product.quantity) throw new AppError(`Only ${product.quantity} available`, 400);
    cart.items.push({ product: productId, quantity } as ICartItem);
  }

  await cart.save();
  logger.info("Cart updated", { userId, productId, quantity, requestId: req.id });
  return response(res, 200, "Item added to cart", cart);
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.id, { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);

  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save();

  logger.info("Cart item removed", { userId, productId, requestId: req.id });
  return response(res, 200, "Item removed successfully");
});


export const getCartByUser =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {

      const cart =
        await Cart.findOne({
          user: req.id,
        }).populate({
          path: "items.product",
    });

      // Empty cart is NOT an error
      if (
        !cart ||
        cart.items.length === 0
      ) {

        logger.info(
          "Cart is empty",
          {
            userId: req.id,
          }
        );

        return response(
          res,
          200,
          "Cart is empty",
          {
            user: req.id,
            items: [],
          }
        );
      }
      

      logger.info(
        "Cart fetched successfully",
        {
          userId: req.id,
        }
      );

      return response(
        res,
        200,
        "Cart fetched successfully",
        cart
      );
    }
  );