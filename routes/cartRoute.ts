import { Router } from "express";
import { multerMiddleware } from "../config/cloudinaryConfig";
import { authenticatedUser } from "../middleware/authMiddleware";
import { addToCart, removeFromCart,getCartByUser } from "../controllers/cartController";
import { addToCartSchema,removeFromCartSchema } from "../validator/cartValidator";
import { validate } from "../middleware/validator";

const router = Router();
router.post("/add", authenticatedUser,validate(addToCartSchema), addToCart);
router.get("/:userId",authenticatedUser, getCartByUser);
router.delete('/remove/:productId',authenticatedUser,validate(removeFromCartSchema),removeFromCart)

export default router;
