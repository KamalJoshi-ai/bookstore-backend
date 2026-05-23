import { Router } from "express";
import { multerMiddleware } from "../config/cloudinaryConfig";
import { authenticatedUser } from "../middleware/authMiddleware";
import { addToWishlist, removeFromWishlist,getWishlistByUser } from "../controllers/wishlistController";
import { validate } from "../middleware/validator";
import { addToWishlistSchema, getWishlistByUserSchema, removeFromWishlistSchema } from "../validator/wishlistValidator";

const router = Router();

router.post("/add", authenticatedUser,validate(addToWishlistSchema), addToWishlist);
router.get("/", authenticatedUser, getWishlistByUser);
router.delete('/remove/:productId',authenticatedUser,validate(removeFromWishlistSchema),removeFromWishlist)

export default router; 