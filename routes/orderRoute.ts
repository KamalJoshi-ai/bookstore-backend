import { Router } from "express";
import {
  createOrUpdateOrder,
  getOrderById,
  getOrdersByUser,
  createPaymentWithRazorpay,
  handleRazorpayWebhook,
} from "../controllers/orderController";
import { authenticatedUser } from "../middleware/authMiddleware";
import {validate} from "../middleware/validator"
import { getOrderByIdSchema ,createPaymentSchema} from "../validator/orderValidator";
const router = Router();

router.post("/", authenticatedUser, createOrUpdateOrder);
router.get("/:orderId", authenticatedUser,validate(getOrderByIdSchema), getOrderById);
router.get("/", authenticatedUser, getOrdersByUser);
router.post('/payment-razorpay',authenticatedUser,createPaymentWithRazorpay)
router.post('/razorpay-webhook',authenticatedUser,handleRazorpayWebhook)
export default router;
