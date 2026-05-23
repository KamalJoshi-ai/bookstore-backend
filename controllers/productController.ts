
import { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinaryConfig";
import Products, { IProduct } from "../models/Products";
import { response } from "../utils/responsehandler";
import logger from "../logger";
import User from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import AppError from "../utils/AppError";
import { FilterQuery } from "mongoose";


export const createProduct = async (req: Request, res: Response) => {
  try {
    const sellerId = req.id;
    if (!sellerId) {
      logger.warn("Product creation failed: seller authentication missing");
      return res.status(401).json({ message: "Seller authentication required" });
    }

    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== "seller") {
      logger.warn(`Unauthorized product creation attempt by user ${sellerId}`);
      return res.status(403).json({ message: "Only sellers can create products" });
    }

    const images = req.files as Express.Multer.File[];
    if (!images || images.length === 0) {
      logger.warn(`Seller ${sellerId} tried to create product without images`);
      return res.status(400).json({ message: "Image is required" });
    }

    let parsedPaymentDetails =
      typeof req.body.paymentDetails === "string"
        ? JSON.parse(req.body.paymentDetails)
        : req.body.paymentDetails;

    if (req.body.paymentMode === "UPI" && !parsedPaymentDetails?.upiId) {
      logger.warn(`Seller ${sellerId} missing UPI ID`);
      return res.status(400).json({ message: "UPI ID is required for payment" });
    }

    if (
      req.body.paymentMode === "Bank Account" &&
      (!parsedPaymentDetails?.bankDetails?.accountNumber ||
        !parsedPaymentDetails?.bankDetails?.ifscCode ||
        !parsedPaymentDetails?.bankDetails?.bankName)
    ) {
      logger.warn(`Seller ${sellerId} missing bank details`);
      return res.status(400).json({ message: "Bank Account details are required for payment" });
    }

    logger.info(`Uploading ${images.length} images for seller ${sellerId}`);
    const uploadedImages = await Promise.all(images.map(file => uploadToCloudinary(file.buffer)));
    const imageUrls = uploadedImages.map(img => img.secure_url);

    const newProduct = new Products({
      ...req.body,
      seller: sellerId,
      images: imageUrls,
      paymentDetails: parsedPaymentDetails,
      quantity: Number(req.body.quantity) || 1,
      isAvailable: true,
    });

    await newProduct.save();
    logger.info(`Product created successfully by seller ${sellerId}`, { productId: newProduct._id });

    return res.status(201).json({ message: "Product Created Successfully", product: newProduct });
  } catch (error: any) {
    logger.error(`Error in createProduct: ${error.message}`, { stack: error.stack });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 9);
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim() || "";

  const normalizeToArray = (value: unknown): string[] =>
    !value ? [] : Array.isArray(value) ? value.map(String) : [String(value)];

  const conditions = normalizeToArray(req.query.condition);
  const classTypes = normalizeToArray(req.query.classType);
  const categories = normalizeToArray(req.query.category);

  const sortOptions: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-low": { finalPrice: 1 },
    "price-high": { finalPrice: -1 },
  };
  const sortOption = sortOptions[req.query.sort as string] || sortOptions.newest;

  const filter: FilterQuery<IProduct> = { isAvailable: true };
  // FilterQuery<IProduct> = type‑safe query filter (partial fields + MongoDB operators).
  if (search) filter.$or = [{ title: { $regex: search, $options: "i" } }, { author: { $regex: search, $options: "i" } }];
  if (conditions.length) filter.condition = { $in: conditions };
  if (categories.length) filter.category = { $in: categories };
  if (classTypes.length) filter.classType = { $in: classTypes };

  const [products, totalProducts] = await Promise.all([
    Products.find(filter).populate({ path: "seller", select: "name email" }).sort(sortOption).skip(skip).limit(limit).lean(),
    Products.countDocuments(filter),
  ]);

  logger.info("Products fetched successfully", { count: products.length, page, limit });
 return res.status(200).json({
  success: true,
  message:
    "Products fetched successfully",
  products,
  currentPage: page,
  totalPages: Math.ceil(
    totalProducts / limit
  ),
  totalProducts,
});
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await Products.findById(id)
    .populate({
      path: "seller",
      select: "name email profilePicture phoneNumber addresses",
      populate: {
        path: "addresses",
        model: "Address",
        select: "fullName city state postalCode addressLine",
      },
    })
    .lean<IProduct>();

  if (!product) throw new AppError("Product not found", 404);

  logger.info("Product fetched successfully", { productId: id });
return response(
  res,
  200,
  "Product fetched successfullyyyyy",
  product
);});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const seller = await User.findById(req.id).select("role");
  if (!seller || seller.role !== "seller")
    throw new AppError("Only sellers can delete products", 403);

  const product = await Products.findOneAndUpdate(
    { _id: productId, seller: req.id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  ).lean<IProduct>();

  if (!product) throw new AppError("Product not found", 404);

  logger.info("Product deleted successfully", { productId, sellerId: req.id });
  return response(res, 200, "Product deleted successfully");
});


export const getProductBySellerId = asyncHandler(async (req: Request, res: Response) => {
  const { sellerId } = req.params;

  const products = await Products.find({ seller: sellerId, isDeleted: false })
    .sort({ createdAt: -1 })
    .populate({ path: "seller", select: "name email profilePicture" })
    .lean<IProduct[]>();

  logger.info("Seller products fetched successfully", { sellerId, count: products.length });
  return response(res, 200, "Products fetched successfully", products);
});


export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  logger.info("Updating product", { productId, sellerId: req.id });

  const seller = await User.findById(req.id).select("role");
  if (!seller || seller.role !== "seller") throw new AppError("Only sellers can update products", 403);

  const product = await Products.findOne({ _id: productId, seller: req.id, isDeleted: false });
  if (!product) throw new AppError("Product not found", 404);

  const { title, subject, category, condition, classType, price, author, edition, description,
          finalPrice, shippingCharge, paymentMode, paymentDetails, existingImages } = req.body;

  const parsedPaymentDetails = typeof paymentDetails === "string" ? JSON.parse(paymentDetails) : paymentDetails;
  const parsedExistingImages: string[] = existingImages
    ? typeof existingImages === "string" ? JSON.parse(existingImages) : existingImages
    : [];

  const newFiles = req.files as Express.Multer.File[];
  let newImageUrls: string[] = [];
  if (newFiles?.length) {
    logger.info("Uploading new product images", { productId, count: newFiles.length });
    const uploadedImages = await Promise.all(newFiles.map(file => uploadToCloudinary(file.buffer)));
    newImageUrls = uploadedImages.map(img => img.secure_url);
  }

  const finalImages = [...parsedExistingImages, ...newImageUrls];
  if (!finalImages.length) throw new AppError("At least one image is required", 400);

  Object.assign(product, {
    title: title ?? product.title,
    subject: subject ?? product.subject,
    category: category ?? product.category,
    condition: condition ?? product.condition,
    classType: classType ?? product.classType,
    price: price ? Number(price) : product.price,
    author: author ?? product.author,
    edition: edition ?? product.edition,
    description: description ?? product.description,
    finalPrice: finalPrice ? Number(finalPrice) : product.finalPrice,
    shippingCharge: shippingCharge ? Number(shippingCharge) : product.shippingCharge,
    paymentMode: paymentMode ?? product.paymentMode,
    paymentDetails: parsedPaymentDetails ?? product.paymentDetails,
    images: finalImages,
    quantity: req.body.quantity ? Number(req.body.quantity) : product.quantity,
    isAvailable: (req.body.quantity ? Number(req.body.quantity) : product.quantity) > 0,
  });

  await product.save();
  logger.info("Product updated successfully", { productId, sellerId: req.id });
  return response(res, 200, "Product updated successfully", product);
});


