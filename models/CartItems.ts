


import mongoose, { Document, Schema } from "mongoose";
import { z } from "zod";

export interface ICartItem extends Document {
  product: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
}


const cartItemsSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product reference is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
    max: [100, "Quantity cannot exceed 100"],
  },
});

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    items: {
      type: [cartItemsSchema],
      default: [],
      validate: {
        validator: (v: ICartItem[]) => v.length <= 50,
        message: "Cart cannot have more than 50 items",
      },
    },
  },
  { timestamps: true },
);

cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ "items.product": 1 });
cartSchema.index({ user: 1, "items.product": 1 });

const CartModel =
  (mongoose.models.Cart as mongoose.Model<ICart>) ||
  mongoose.model<ICart>("Cart", cartSchema);

export default CartModel;



// import mongoose, { Document, Schema } from "mongoose";

// export interface ICartItem extends Document {
//   product: mongoose.Types.ObjectId;
//   quantity: number;
// }

// export interface ICart extends Document {
//   user: mongoose.Types.ObjectId;
//   items: ICartItem[];
// }

// const cartItemsSchema = new Schema<ICartItem>(
//   {
//     product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
//     quantity: { type: Number, required: true, min: 1 },
//   },
// );


// const cartSchema = new Schema<ICart>(
//   {
//     user: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     items: { type: [cartItemsSchema], default: [] },
//   },
//   { timestamps: true }
// );

// const CartModel =
//   (mongoose.models.Cart as mongoose.Model<ICart>) ||
//   mongoose.model<ICart>("Cart", cartSchema);

// export default CartModel;
// // export { cartItemsSchema };
