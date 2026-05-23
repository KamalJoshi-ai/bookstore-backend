import {z} from 'zod'
import mongoose from 'mongoose'

export const addToWishlistSchema =
  z.object({
    body: z.object({
      productId: z.string().refine(
        mongoose.Types.ObjectId.isValid,
        {
          message: "Invalid product id",
        }
      ),
  })
  });

  export const removeFromWishlistSchema =
  z.object({
    params:  z.object({
      productId: z.string().refine(
        mongoose.Types.ObjectId.isValid,
        {
          message: "Invalid product id",
        }
      ),
  })
  });
  export const getWishlistByUserSchema =
  z.object({
    params: z.object({
      productId: z.string().refine(
        mongoose.Types.ObjectId.isValid,
        {
          message: "Invalid product id",
        }
      ),
  })
  });