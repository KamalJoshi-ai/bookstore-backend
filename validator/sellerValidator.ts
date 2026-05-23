import { z } from "zod";
import mongoose from "mongoose";

export const updateOrderStatusSchema =
  z.object({
    params: z.object({
      orderId: z.string().refine(
        mongoose.Types.ObjectId.isValid,
        {
          message: "Invalid order id",
        }
      ),
    }),

    body: z.object({
      status: z.enum([
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ]),

      trackingNumber:
        z.string().optional(),

      courierName:
        z.string().optional(),
    }),
  });