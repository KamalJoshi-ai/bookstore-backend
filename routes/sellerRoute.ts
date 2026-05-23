import { Router } from "express";
import {
  getSellerStats,
  getSellerOrders,
  getSellerListings,
  updateOrderStatus,
} from "../controllers/sellerController";
import { authenticatedUser } from "../middleware/authMiddleware"
import { isAuthorized } from "../middleware/authMiddleware"
import { validate } from "../middleware/validator";
import {   updateOrderStatusSchema } from "../validator/sellerValidator";

const router = Router();

// Saare seller routes protected hain
router.use(authenticatedUser, isAuthorized("seller", "admin"));
router.get("/stats", getSellerStats);
router.get("/orders", getSellerOrders);
router.get("/listings", getSellerListings);
router.patch("/orders/:orderId/status",validate(updateOrderStatusSchema), updateOrderStatus);

export default router;