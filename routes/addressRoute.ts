import express from 'express'
import { authenticatedUser } from '../middleware/authMiddleware'
import * as AddressController from '../controllers/addressController'
import { addOrUpdateAddressSchema} from '../validator/addressValidator';
import { validate } from '../middleware/validator';


const router = express.Router();
router.post('/create-or-update',authenticatedUser,validate(addOrUpdateAddressSchema),AddressController.createOrUpdateAddressByUserId)
router.get('/',authenticatedUser,AddressController.getAddressByUserId)
export default router;