import mongoose from "mongoose";
import { z } from "zod";

export const orderSchema = z.object({
  body: z.object({
    orderId: z.string()
      .refine(
        mongoose.Types.ObjectId.isValid,
        "Invalid order id"
      )
      .optional(),

    shippingAddress: z.array(
      z.string().refine(
        mongoose.Types.ObjectId.isValid,
        "Invalid address id"
      )
    ).min(1),

    paymentMethod: z.enum([
      "razorpay",
      "cod"
    ]),

    totalAmount: z.number()
      .positive(),

    paymentDetails: z.object({
      razorpay_order_id: z.string().optional(),
      razorpay_payment_id: z.string().optional(),
      razorpay_signature: z.string().optional()
    }).optional()
  })
});


export const getOrderByIdSchema = z.object({
  params: z.object({
    orderId: z.string().refine(
      (id) => mongoose.Types.ObjectId.isValid(id),
      {
        message: "Invalid order id",
      }
    ),
  }),
});

  export const createPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().refine(
      (id) => mongoose.Types.ObjectId.isValid(id),
      {
        message: "Invalid order id",
      }
    ),
  }),
});