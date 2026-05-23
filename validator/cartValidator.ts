import mongoose from "mongoose";
import { z } from "zod";

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().refine(
      (id) => mongoose.Types.ObjectId.isValid(id),
      {
        message: "Invalid product id",
      }
    ),

    quantity: z.coerce
      .number()
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1"),
  }),
});
export const removeFromCartSchema = z.object({
  params: z.object({
    productId: z.string().refine(
      (id) => mongoose.Types.ObjectId.isValid(id),
      {
        message: "Invalid product id",
      }
    ),
  }),
});