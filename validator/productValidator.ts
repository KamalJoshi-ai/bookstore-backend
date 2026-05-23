import mongoose from 'mongoose';
import * as yup from 'yup';
import {z} from 'zod'

export const createProductSchema = yup.object().shape({
  title: yup
    .string()
    .trim()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .matches(/^[a-zA-Z0-9\s\-:(),.&']+$/, 'Title contains invalid characters'),

  author: yup
    .string()
    .trim()
    .required('Author is required')
    .min(2, 'Author must be at least 2 characters')
    .max(100, 'Author cannot exceed 100 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Author can only contain letters and spaces'),

  edition: yup.string().trim().max(50, 'Edition cannot exceed 50 characters').nullable(),

  description: yup.string().trim().max(1000, 'Description cannot exceed 1000 characters').nullable(),

  category: yup
    .string()
    .required('Category is required')
    .oneOf(['Reading Books', 'Academic', 'Self-Help', 'Biography', 'Other'], 'Invalid category'),

  classType: yup
    .string()
    .required('Class type is required')
    .oneOf(['B.Com', 'B.A', 'B.Sc', 'B.Tech', 'M.Com', 'Other'], 'Invalid class type'),

  subject: yup
    .string()
    .required('Subject is required')
    .oneOf(['Fiction', 'Math', 'Science', 'History', 'Economics', 'Other'], 'Invalid subject'),

  condition: yup
    .string()
    .required('Condition is required')
    .oneOf(['Excellent', 'Good', 'Fair', 'Poor'], 'Invalid condition'),

  price: yup
    .number()
    .required('Original price is required')
    .typeError('Price must be a number')
    .positive('Price must be greater than 0')
    .max(999999, 'Price cannot exceed 999,999')
    .test('is-decimal', 'Price can have maximum 2 decimal places', (value) => {
      if (!value) return true;
      return /^\d+(\.\d{1,2})?$/.test(String(value));
    }),

  finalPrice: yup
    .number()
    .required('Selling price is required')
    .typeError('Selling price must be a number')
    .positive('Selling price must be greater than 0')
    .max(999999, 'Selling price cannot exceed 999,999')
    .test('is-decimal', 'Price can have maximum 2 decimal places', (value) => {
      if (!value) return true;
      return /^\d+(\.\d{1,2})?$/.test(String(value));
    })
    .test('less-than-original', 'Selling price should be less than or equal to original price', function (value) {
      const { price } = this.parent;
      if (!value || !price) return true;
      return value <= price;
    }),

  shippingCharge: yup
    .number()
    .required('Shipping charge is required')
    .typeError('Shipping charge must be a number')
    .min(0, 'Shipping charge cannot be negative')
    .max(999999, 'Shipping charge cannot exceed 999,999')
    .test('is-decimal', 'Price can have maximum 2 decimal places', (value) => {
      if (value === undefined || value === null) return true;
      return /^\d+(\.\d{1,2})?$/.test(String(value));
    }),
quantity: yup
  .number()
  .required('Quantity is required')
  .min(1, 'Atleast 1 copy required')
  .max(10, 'Maximum 10 copies')
  .integer('Must be a whole number')
  .typeError('Quantity must be a number'),

  paymentMode: yup
    .string()
    .required('Payment mode is required')
.oneOf(['UPI', 'Bank Account'], 'Invalid payment mode'),
  upiId: yup.string().when('paymentMode', {
    is: 'UPI',
    then: (schema) =>
      schema
        .required('UPI ID is required')
        .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/, 'Invalid UPI format (e.g., yourname@upi)')
        .max(255, 'UPI ID is too long'),
    otherwise: (schema) => schema.strip(),
  }),

  accountNumber: yup.string().when('paymentMode', {
    is: 'Bank Account',
    then: (schema) =>
      schema
        .required('Account number is required')
        .matches(/^[0-9]{9,18}$/, 'Account number must be 9-18 digits')
        .test('valid-account', 'Invalid account number format', (value) => {
          if (!value) return true;
          const allSame = /^(\d)\1+$/.test(value);
          if (allSame) return false;
          return true;
        }),
    otherwise: (schema) => schema.strip(),
  }),

  ifscCode: yup.string().when('paymentMode', {
    is: 'Bank Account',
    then: (schema) =>
      schema
        .required('IFSC code is required')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g., SBIN0001234)'),
    otherwise: (schema) => schema.strip(),
  }),

  bankName: yup.string().when('paymentMode', {
    is: 'Bank Account',
    then: (schema) =>
      schema
        .required('Bank name is required')
        .min(2, 'Bank name must be at least 2 characters')
        .max(100, 'Bank name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Bank name can only contain letters and spaces'),
    otherwise: (schema) => schema.strip(),
  }),
});

 export const getAllProductsSchema =
  z.object({
    query: z.object({
      page: z.string().optional(),

      limit: z.string().optional(),

      search: z.string().optional(),

      sort: z.enum([
        "newest",
        "oldest",
        "price-low",
        "price-high",
      ]).optional(),

      condition: z.union([
        z.string(),
        z.array(z.string()),
      ]).optional(),

      category: z.union([
        z.string(),
        z.array(z.string()),
      ]).optional(),

      classType: z.union([
        z.string(),
        z.array(z.string()),
      ]).optional(),
    }),
  });

  export const getProductByIdSchema =
  z.object({
    params: z.object({
      id: z.string().refine(
        mongoose.Types.ObjectId.isValid,
        {
          message: "Invalid product id",
        }
      ),
    }),
  });
  
  export const deleteProductSchema =
  z.object({
    params: z.object({
      id: z.string().refine(
        mongoose.Types.ObjectId.isValid,
        {
          message: "Invalid product id",
        }
      ),
    }),
  });
  export const getProductBySellerIdSchema =
  z.object({
    params: z.object({
      id: z.string().refine(
        mongoose.Types.ObjectId.isValid,
        {
          message: "Invalid product id",
        }
      ),
    }),
  });
 

export const updateProductSchema =
  z.object({

    params: z.object({
      productId: z.string().refine(
        mongoose.Types.ObjectId.isValid,
        {
          message: "Invalid product id",
        }
      ),
    }),

    body: z.object({

      title: z.string()
        .min(3)
        .optional(),

      subject: z.string()
        .optional(),

      category: z.string()
        .optional(),

      condition: z.string()
        .optional(),

      classType: z.string()
        .optional(),

      price: z.coerce
        .number()
        .positive()
        .optional(),

      author: z.string()
        .optional(),

      edition: z.string()
        .optional(),

      description: z.string()
        .optional(),

      finalPrice: z.coerce
        .number()
        .positive()
        .optional(),

      shippingCharge: z.coerce
        .number()
        .min(0)
        .optional(),

      quantity: z.coerce
        .number()
        .int()
        .min(0)
        .optional(),

      paymentMode: z.enum([
        "UPI",
        "Bank Account",
      ]).optional(),

      paymentDetails: z
        .string()
        .optional(),

      existingImages: z
        .string()
        .optional(),
    }),
  });