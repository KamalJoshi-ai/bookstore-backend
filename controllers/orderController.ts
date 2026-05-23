
import Razorpay from "razorpay";
import Cart from "../models/CartItems";
import Order from "../models/Order";
import {IOrder} from "../models/Order";
import { response } from "../utils/responsehandler";
import { Request, Response } from "express";
import crypto from "crypto";
import dotenv from "dotenv";


import Product from "../models/Products";
import mongoose from "mongoose";
import logger from "../logger";
import { asyncHandler } from "../utils/asyncHandler";
import AppError from "../utils/AppError";
dotenv.config();
function normalizePaymentDetails(details: any) {
  return typeof details === "string" ? JSON.parse(details) : details;
}

async function validateStock(items: { product: mongoose.Types.ObjectId; quantity: number }[]) {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isAvailable) {
      throw new Error(`"${product?.title ?? "A product"}" is out of stock`);
    }
    if (item.quantity > product.quantity) {
      throw new Error(
        `Only ${product.quantity} ${product.quantity === 1 ? "copy" : "copies"} available for "${product.title}"`
      );
    }
  }
}

async function updateStock(items: any[], session: mongoose.ClientSession) {
  for (const item of items) {
    const product = await Product.findById(item.product).session(session);

    if (product) {
    
      product.quantity = Math.max(0, product.quantity - item.quantity);
      if (product.quantity === 0) product.isAvailable = false;
    
      await product.save({ session });
     
    }
  }
}

export const createOrUpdateOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, shippingAddress, paymentMethod, totalAmount, paymentDetails } = req.body;
    const userId = req.id;

    if (!userId) {
      logger.warn("Unauthorized order attempt");
      return response(res, 401, "Unauthorized");
    }

    let order = null;

    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).session(session);
    }

    if (!order) {
      order = await Order.findOne({ user: userId, status: "pending" }).session(session);
    }

    if (order) {
    
      logger.info(`Updating existing order for user ${userId}`);
      order.shippingAddress = shippingAddress ?? order.shippingAddress;
      order.paymentMethod = paymentMethod ?? order.paymentMethod;
      order.totalAmount = totalAmount ?? order.totalAmount;

      if (paymentDetails) {
       
        order.paymentDetails = normalizePaymentDetails(paymentDetails);
        order.paymentStatus = "complete";
        order.status = "processing";

        await validateStock(order.items);
         
          await updateStock(order.items, session);
         
          await Cart.updateOne({ user: userId }, { $set: { items: [] } }).session(session);
          
      }
    } else {
      logger.info(`Creating new order for user ${userId}`);
      const cart = await Cart.findOne({ user: userId }).populate("items.product").session(session);
      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        logger.warn(`Cart empty for user ${userId}`);
        return response(res, 400, "Cart is empty");
      }

      await validateStock(cart.items.map((i: any) => ({ product: i.product._id, quantity: i.quantity })));

      const orderItems = cart.items.map((item: any) => ({
        product: item.product._id,
        price: item.product.finalPrice,
        quantity: item.quantity,
        status: "pending",
      }));

      order = new Order({
        user: userId,
        items: orderItems,
        totalAmount,
        shippingAddress,
        paymentMethod: paymentMethod || "razorpay",
        paymentDetails: normalizePaymentDetails(paymentDetails),
        paymentStatus: paymentDetails ? "complete" : "pending",
        status: paymentDetails ? "processing" : "pending",
      });
    }

    await order.save({ session });
    await session.commitTransaction();

    logger.info(`Order successfully created/updated for user ${userId}`);
    return response(res, 200, "Order created successfully", order);
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(`Order creation failed: ${error.message}`);
    return response(res, 500, "Internal Server Error");
  } finally {
    session.endSession();
  }
};

export const getOrderById = asyncHandler(async (req:Request, res: Response) => {
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId, user: req.id })
    .populate({ path: "items.product", select: "name finalPrice images" })
    .populate({ path: "shippingAddress", select: "fullName mobile city state postalCode addressLine" })
    .lean();

  if (!order) throw new AppError("Order not found", 404);

  logger.info("Order fetched successfully", { userId: req.id, orderId });
  return response(res, 200, "Order fetched successfully", order);
});

export const getOrdersByUser = asyncHandler(
  async (req: Request, res: Response) => {
    const orders = await Order.find({
      user: req.id,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.product",
        
      })
      .populate({
        path: "shippingAddress",
      })
      .populate({
        path: "user",
       
      })
      .lean();

    logger.info("Orders fetched successfully", {
      userId: req.id,
      count: orders.length,
    });

    return response(
      res,
      200,
      "Orders fetched successfully",
      orders
    );
  }
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export const createPaymentWithRazorpay = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn(`Order ${orderId} not found for Razorpay payment`);
      return response(res, 404, "Order not found");
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    logger.info(`Razorpay order created for order ${orderId}`);
    return response(res, 200, "Razorpay order created successfully", { order: razorpayOrder });
  } catch (error: any) {
    logger.error(`Razorpay order creation failed: ${error.message}`);
    return response(res, 500, "Internal Server Error");
  }
};

//mai frontend se backend route ko call nahi karta razorpay karta h ye route razorpay me dena hota h



export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    logger.info("Webhook received from Razorpay");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET as string;
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      logger.warn("Invalid Razorpay signature detected");
      return response(res, 400, "Invalid signature");
    }

    const paymentId = req.body.payload.payment.entity.id;
    const orderId = req.body.payload.payment.entity.order_id;

    logger.info(`Valid Razorpay webhook: paymentId=${paymentId}, orderId=${orderId}`);

    const updatedOrder = await Order.findOneAndUpdate(
      { "paymentDetails.razorpay_order_id": orderId },
      {
        paymentStatus: "complete",
        status: "processing",
        "paymentDetails.razorpay_payment_id": paymentId,
      },
      { new: true }
    );

    if (!updatedOrder) {
      logger.warn(`No matching order found for Razorpay orderId=${orderId}`);
      return response(res, 404, "Order not found for webhook");
    }

    logger.info(`Order ${updatedOrder._id} updated successfully via webhook`);
    return response(res, 200, "Webhook processed successfully", updatedOrder);
  } catch (error: any) {
    logger.error(`Webhook processing failed: ${error.message}`);
    return response(res, 500, "Internal Server Error");
  }
};
