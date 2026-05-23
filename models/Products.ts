import mongoose, { Document, Schema } from "mongoose";
import { z } from "zod";

export interface IProduct extends Document {
  title: string;
  images: string[];
  subject: string;
  category: string;
  condition: string;
  classType: string;
  price: number;
  author: string;
  edition?: string;
  description?: string;
  finalPrice: number;
  shippingCharge: string;
  seller: mongoose.Types.ObjectId;
  isDeleted: boolean;
  paymentMode: "UPI" | "Bank Account";
  quantity: number;
  isAvailable: boolean;
  paymentDetails: {
    upiId?: string;
    bankDetails?: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
    };
  };
}

const upiRegex = /^[\w.-]+@[\w.-]+$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;


const ProductSchema: Schema<IProduct> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 10,
        message: "Images must have between 1 and 10 entries",
      },
    },
    subject: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    condition: {
      type: String,
      required: true,
      enum: {
        values:  ["Excellent", "Good", "Fair", "Poor"],
        message: "Invalid condition value",
      },
    },
    classType: { type: String, required: true, trim: true },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
      max: [100000, "Price cannot exceed 1,00,000"],
    },
    author: { type: String, required: true, trim: true },
    edition: { type: String, trim: true },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    finalPrice: {
      type: Number,
      required: true,
      min: [0, "Final price cannot be negative"],
      max: [100000, "Final price cannot exceed 1,00,000"],
    },
    shippingCharge: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: { type: Number, default: 1, min: [0, "Quantity cannot be negative"] },
    isAvailable: { type: Boolean, default: true },
    paymentMode: {
      type: String,
      enum: ["UPI", "Bank Account"],
      required: true,
    },
    paymentDetails: {
      upiId: {
        type: String,
        match: [upiRegex, "Invalid UPI ID format"],
      },
      bankDetails: {
        accountNumber: {
          type: String,
          minlength: [10, "Account number must be at least 10 digits"],
          maxlength: [18, "Account number cannot exceed 18 digits"],
        },
        ifscCode: {
          type: String,
          match: [ifscRegex, "Invalid IFSC code format"],
        },
        bankName: { type: String },
      },
    },
  },
  { timestamps: true },
);

ProductSchema.index({ seller: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ subject: 1 });
ProductSchema.index({ classType: 1 });
ProductSchema.index({ isDeleted: 1, isAvailable: 1 });
ProductSchema.index({ seller: 1, isDeleted: 1 });
ProductSchema.index({ category: 1, subject: 1, classType: 1 });
ProductSchema.index({ finalPrice: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index(
  { title: "text", description: "text", author: "text" },
  { weights: { title: 10, author: 5, description: 1 }, name: "product_text_search" },
);

export default mongoose.model<IProduct>("Product", ProductSchema);


// import mongoose, { Document, Schema } from "mongoose";

// export interface IProduct extends Document {
//   title: string;
//   images: string[];
//   subject: string;
//   category: string;
//   condition: string;
//   classType: string;
//   price: number;
//   author: string;
//   edition?: string;
//   description?: string;
//   finalPrice: number;
//   shippingCharge: string;
//   seller: mongoose.Types.ObjectId;
//   isDeleted: boolean;
//   paymentMode: "UPI" | "Bank Account";
//   quantity: number,
//   isAvailable: boolean,
//   paymentDetails: {
//     upiId?: string;
//     bankDetails?: {
//       accountNumber: string;
//       ifscCode: string;
//       bankName: string;
//     };
//   };
// }

// const ProductSchema: Schema<IProduct> = new Schema(
//   {
//     title: { type: String, required: true },
//     images: { type: [String], required: true },
//     subject: { type: String, required: true },
//     category: { type: String, required: true },
//     condition: { type: String, required: true },
//     classType: { type: String, required: true },
//     price: { type: Number, required: true },
//     author: { type: String, required: true },
//     edition: { type: String },
//     description: { type: String },
//     finalPrice: { type: Number, required: true },
//     shippingCharge: { type: String, required: true },
//     isDeleted: { type: Boolean, default: false },
//     seller: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     quantity: { type: Number, default: 1, min: 0 },
//     isAvailable: { type: Boolean, default: true },
//     paymentMode: {
//       type: String,
//       enum: ["UPI", "Bank Account"],
//       required: true,
//     },

//     paymentDetails: {
//       upiId: {
//         type: String,
//         required: true,
//         match: /^[\w.-]+@[\w.-]+$/ // basic UPI format
//       },
//       bankDetails: {
//         accountNumber: {
//           type: String,
//           required: true,
//           minlength: 10
//         },
//         ifscCode: {
//           type: String,
//           match: /^[A-Z]{4}0[A-Z0-9]{6}$/ // IFSC validation
//         },
//         bankName: {
//           type: String,
//           required: true
//         },
        
//       }
//     }
//   },
//   { timestamps: true }
// );

// export default mongoose.model<IProduct>("Product", ProductSchema);
