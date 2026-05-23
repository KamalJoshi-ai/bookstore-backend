


import mongoose, { Document, Schema } from "mongoose";
import { IAddress } from "./Address";

export interface OrderItem extends Document {
  product: mongoose.Types.ObjectId;
  price: number;
  quantity: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: IAddress[];
  paymentStatus: "pending" | "complete" | "failed";
  paymentMethod: string;
  paymentDetails: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  courierName?: string;
  createdAt: Date;
}

const orderStatusEnum = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;


const orderItemsSchema = new Schema<OrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product reference is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  status: {
    type: String,
    enum: orderStatusEnum,
    default: "pending",
  },
});

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    items: {
      type: [orderItemsSchema],
      required: true,
      validate: {
        validator: (arr: OrderItem[]) => arr.length > 0,
        message: "Order must contain at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    shippingAddress: [
      {
        type: Schema.Types.ObjectId,
        ref: "Address",
        required: true,
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["pending", "complete", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
    paymentDetails: {
      razorpay_order_id: { type: String },
      razorpay_payment_id: { type: String },
      razorpay_signature: { type: String },
    },
    status: {
      type: String,
      enum: orderStatusEnum,
      default: "processing",
    },
    trackingNumber: { type: String },
    courierName: { type: String },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "items.product": 1 });

const OrderModel =
  mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;


// import mongoose, { Document, Schema } from "mongoose";
// import { IAddress } from "./Address";

// export interface OrderItem extends Document {
//   product: mongoose.Types.ObjectId;
//   price: number;
//   quantity: number;
//   status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
// }

// export interface Order extends Document {
//   user: mongoose.Types.ObjectId;
//   items: OrderItem[];
//   totalAmount: number;
//   // shippingAddress: (mongoose.Types.ObjectId | IAddress)[];
//   shippingAddress: IAddress[];
//   paymentStatus: "pending" | "complete" | "failed";
//   paymentMethod: string;
//   paymentDetails: {
//     razorpay_order_id?: string;
//     razorpay_payment_id?: string;
//     razorpay_signature?: string;
//   };
//   status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
//   trackingNumber?: string;
//   courierName?: string;
//   createdAt: Date;
// }

// const orderItemsSchema = new Schema<OrderItem>({
//   product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
//   price: { type: Number, required: true },
//   quantity: { type: Number, required: true },
//   status: {
//     type: String,
//     enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
//     default: "pending",
//   },
// });

// const orderSchema = new Schema<Order>(
//   {
//     user: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     items: {
//       type: [orderItemsSchema],
//       required: true,
//       validate: [
//         (arr: any[]) => arr.length > 0,
//         "Order must contain at least one item",
//       ],
//     },
//     totalAmount: {
//       type: Number,
//       required: true,
//     },
//     shippingAddress: [
//       {
//         type: Schema.Types.ObjectId,
//         ref: "Address",
//         required: true,
//       },
//     ],
//     paymentStatus: {
//       type: String,
//       enum: ["pending", "complete", "failed"],
//       default: "pending",
//     },
//     paymentMethod: {
//       type: String,
//       required: true,
//     },
//     paymentDetails: {
//       razorpay_order_id: { type: String },
//       razorpay_payment_id: { type: String },
//       razorpay_signature: { type: String },
//     },
//     status: {
//       type: String,
//       enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
//       default: "processing",
//     },
//     trackingNumber: { type: String },
//     courierName: { type: String }, 
//   },
//   { timestamps: true },
// );

// orderSchema.index({ user: 1 });
// orderSchema.index({ status: 1 });
// orderSchema.index({ createdAt: -1 });

// const OrderModel =
//   mongoose.models.Order || mongoose.model<Order>("Order", orderSchema);

// export default OrderModel;
