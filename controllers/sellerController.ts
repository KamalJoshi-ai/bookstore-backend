
import { Request, Response } from "express";
import Order, { IOrder } from "../models/Order";
import Product, { IProduct } from "../models/Products";
import { response } from "../utils/responsehandler";
import mongoose from "mongoose";
import { sendCancellationEmail, sendDeliveryEmail, sendShippingEmail } from "../config/emailConfig";
import logger from "../logger"; 
import { asyncHandler } from "../utils/asyncHandler";
import AppError from "../utils/AppError";

export const getSellerStats = asyncHandler(async (req:Request, res: Response) => {
  const sellerId = new mongoose.Types.ObjectId(req.id);

  const sellerProductIds = await Product.find({ seller: sellerId, isDeleted: false }).distinct("_id");
  const sellerOrders = await Order.find({ "items.product": { $in: sellerProductIds }, paymentStatus: "complete" }).lean<IOrder[]>();

  const pendingOrders = sellerOrders.filter(o => o.status === "processing").length;
  const shippedOrders = sellerOrders.filter(o => o.status === "shipped").length;
  const deliveredOrders = sellerOrders.filter(o => o.status === "delivered").length;

  const totalEarnings = sellerOrders.reduce((total, order) => {
    const sellerTotal = order.items.reduce((sum:any, item:any) => {
      if (sellerProductIds.some(id => id.equals(item.product))) sum += item.price * item.quantity;
      return sum;
    }, 0);
    return total + sellerTotal;
  }, 0);

  const totalBooks = sellerProductIds.length;
  const totalOrders = sellerOrders.length;
  const activeListings = totalBooks - deliveredOrders;

  logger.info("Seller stats fetched successfully", { sellerId: req.id, totalBooks, totalOrders });
  return response(res, 200, "Seller stats fetched successfully", {
    totalBooks,
    totalOrders,
    totalEarnings,
    pendingOrders,
    shippedOrders,
    deliveredOrders,
    activeListings,
  });
});

export const getSellerOrders = asyncHandler(async (req:Request, res: Response) => {
  const sellerId = new mongoose.Types.ObjectId(req.id);
  logger.info("Fetching seller orders", { sellerId: req.id });

  const sellerProductIds = await Product.find({ seller: sellerId, isDeleted: false }).distinct("_id");
  const productIdSet = new Set(sellerProductIds.map(id => id.toString()));

  const orders = await Order.find({ "items.product": { $in: sellerProductIds } })
    .populate({ path: "user", select: "name email" })
    .populate({ path: "items.product", select: "title images finalPrice condition author" })
    .populate({ path: "shippingAddress", select: "fullName city state postalCode addressLine phoneNumber" })
    .sort({ createdAt: -1 })
    .lean<IOrder[]>();

  const filteredOrders = orders.map(order => ({
    _id: order._id,
    user: order.user,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    status: order.status,
    trackingNumber: order.trackingNumber,
    courierName: order.courierName,
    createdAt: order.createdAt,
    shippingAddress: order.shippingAddress,
    items: order.items.filter((item: any) => {
      const productId = (item.product as any)?._id || item.product;
      return productIdSet.has(productId.toString());
    }),
  }));

  logger.info("Seller orders fetched successfully", { sellerId: req.id, count: filteredOrders.length });
  return response(res, 200, "Seller orders fetched successfully", { orders: filteredOrders });
});

export const getSellerListings = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.id;
  logger.info("Fetching seller listings", { sellerId });

  const products = await Product.find({ seller: sellerId, isDeleted: false })
    .sort({ createdAt: -1 })
    .lean<IProduct[]>();

  logger.info("Seller listings fetched successfully", { sellerId, count: products.length });
  return response(res, 200, "Seller listings fetched successfully", { products });
});

  
export const updateOrderStatus = asyncHandler(async (req:Request, res: Response) => {
  const { orderId } = req.params;
  const { status, trackingNumber, courierName } = req.body;
  const sellerId = new mongoose.Types.ObjectId(req.id);

  logger.info("Updating order status", { orderId, sellerId: req.id, status });

  const order = await Order.findById(orderId)
    .populate("user", "name email")
    .populate("items.product", "title");
  if (!order) throw new AppError("Order not found", 404);

  const sellerProductIds = await Product.find({ seller: sellerId, isDeleted: false }).distinct("_id");
  const productIdSet = new Set(sellerProductIds.map(id => id.toString()));

  const hasSellerItem = order.items.some((item: any) => {
    const productId = (item.product as any)?._id ?? item.product;
    return productIdSet.has(productId.toString());
  });
  if (!hasSellerItem) throw new AppError("Unauthorized", 403);

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (courierName) order.courierName = courierName;

  order.items = order.items.map((item: any) => {
    const productId = item.product?._id ?? item.product;
    if (productIdSet.has(productId.toString())) item.status = status;
    return item;
  });

  await order.save();
  logger.info("Order updated successfully", { orderId, sellerId: req.id, status });

  const customer = order.user as any;
  const books = order.items.map((item: any) => item.product?.title ?? "Book");

  if (status === "shipped" && trackingNumber) {
    await sendShippingEmail(customer.email, {
      customerName: customer.name,
      orderId: order._id.toString(),
      trackingNumber,
      courierName: courierName ?? order.courierName ?? "Courier",
      books,
      shippedDate: new Date(),
    });
  }
  if (status === "delivered") {
    await sendDeliveryEmail(customer.email, {
      customerName: customer.name,
      orderId: order._id.toString(),
      books,
      deliveredDate: new Date(),
    });
  }
  if (status === "cancelled") {
    await sendCancellationEmail(customer.email, {
      customerName: customer.name,
      orderId: order._id.toString(),
      books,
    });
  }

  return response(res, 200, "Order updated successfully", { order });
});
