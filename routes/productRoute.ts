import { Router } from "express";
import { createProduct,deleteProduct,getAllProducts,getProductById,getProductBySellerId } from "../controllers/productController";
import { multerMiddleware } from "../config/cloudinaryConfig";
import { authenticatedUser } from "../middleware/authMiddleware";
import { isAuthorized } from "../middleware/authMiddleware";
import { updateProduct } from "../controllers/productController";
import { validate } from "../middleware/validator";

import { createProductSchema, deleteProductSchema, getAllProductsSchema, getProductByIdSchema, getProductBySellerIdSchema, updateProductSchema } from "../validator/productValidator";
const router = Router();

router.post("/create", authenticatedUser, multerMiddleware,createProduct);
router.get("/",validate(getAllProductsSchema), getAllProducts);
router.get("/:id",validate(getProductByIdSchema), getProductById);
router.delete('/seller/:productId',authenticatedUser,validate(deleteProductSchema),deleteProduct)
router.get('/seller/:sellerId',authenticatedUser,validate(getProductBySellerIdSchema),getProductBySellerId)
router.put("/update/:productId", authenticatedUser, multerMiddleware, isAuthorized("seller", "admin"),validate(updateProductSchema), updateProduct);
export default router;
