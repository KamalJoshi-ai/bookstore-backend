import express from 'express'
import { authenticatedUser } from '../middleware/authMiddleware'
import * as UserController from '../controllers/userController'
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
router.post('/profile/update/:userId',upload.single("profilePicture"),authenticatedUser,UserController.updateUserProfile)
router.patch('/become-seller', authenticatedUser, UserController.becomeSeller);
export default router;