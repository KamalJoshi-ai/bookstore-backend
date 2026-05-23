import mongoose, { Document, Schema } from "mongoose";
import { z } from "zod";
import validator from "validator";

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId;
  addressLine1: string;
  addressLine2?: string | null;
  phoneNumber: string;
  city: string;
  state: string;
  pincode: string;
}
const addressSchema = new Schema<IAddress>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    addressLine1: {
      type: String,
      required: [true, "Address line 1 is required"],
      trim: true,
      minlength: [5, "Address line 1 must be at least 5 characters"],
      maxlength: [200, "Address line 1 cannot exceed 200 characters"],
    },
    addressLine2: {
      type: String,
      default: null,
      trim: true,
      maxlength: [200, "Address line 2 cannot exceed 200 characters"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: (v: string) =>
          validator.isMobilePhone(v, "any", { strictMode: false }),
        message: "Please provide a valid phone number",
      },
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      minlength: [2, "City must be at least 2 characters"],
      maxlength: [100, "City cannot exceed 100 characters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      minlength: [2, "State must be at least 2 characters"],
      maxlength: [100, "State cannot exceed 100 characters"],
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      match: [/^\d{6}$/, "Pincode must be a 6-digit number"],
    },
  },
  { timestamps: true },
);

addressSchema.index({ user: 1 });
addressSchema.index({ pincode: 1 });
addressSchema.index({ user: 1, pincode: 1 });

const AddressModel =
  (mongoose.models.Address as mongoose.Model<IAddress>) ||
  mongoose.model<IAddress>("Address", addressSchema);

export default AddressModel;


// import mongoose, { Document, Schema } from "mongoose";
// import orders from "razorpay/dist/types/orders";
// export interface IAddress extends Document {
//   user: mongoose.Types.ObjectId;
//   addressLine1: string;
//   addressLine2?: string | null;
//   phoneNumber: string;
//   city: string;
//   state: string;
//   pincode: string;
// }
// const addressSchema = new Schema<IAddress>(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     addressLine1: { type: String, required: true },
//     addressLine2: { type: String, default: null },
//     phoneNumber: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     pincode: { type: String, required: true },
//   },
//   { timestamps: true }
// );
// const AddressModel =
//   (mongoose.models.Address as mongoose.Model<IAddress>) ||
//   mongoose.model<IAddress>("Address", addressSchema);

// export default AddressModel;

// If a field is optional in TypeScript but required in Mongoose, then:

// TypeScript allows missing data
// Mongoose throws an error when saving

// Best practice:
// Keep both TypeScript and Mongoose in sync so errors are caught early.

// One line:
// Mongoose enforces rules at runtime, TypeScript helps catch mistakes before runtime.

// whats the use of interface in models 

// the main is compile time checking and also the schema should contain all its fields 
// Next is like if any object is using inteface as type it will be consistent 

// const order :Order = {}

// await orders.create(order)
//it also provides consistency 
