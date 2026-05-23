// import mongoose, { Schema, Document } from "mongoose";

// export interface IWishlist extends Document {
//   user: mongoose.Types.ObjectId;
//   products: mongoose.Types.ObjectId[];
// }

// const wishlistSchema = new Schema<IWishlist>(
//   {
//     user: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       unique: true, // each user has only one wishlist
//     },

//     products: [
//       {
//         type: Schema.Types.ObjectId,
//         ref: "Product",
//       },
//     ],
//   },
//   { timestamps: true }
// );

// const WishlistModel =
//   (mongoose.models.Wishlist as mongoose.Model<IWishlist>) ||
//   mongoose.model<IWishlist>("Wishlist", wishlistSchema);

// export default WishlistModel;
import mongoose, { Schema, Document } from "mongoose";

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
}



const wishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },

    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true },
);

wishlistSchema.index({ user: 1 }, { unique: true });
wishlistSchema.index({ products: 1 });
wishlistSchema.index({ user: 1, products: 1 });

wishlistSchema.pre("save", function (next) {
  const seen = new Set<string>();
  this.products = this.products.filter((id) => {
    const key = id.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  next();
});

const WishlistModel =
  (mongoose.models.Wishlist as mongoose.Model<IWishlist>) ||
  mongoose.model<IWishlist>("Wishlist", wishlistSchema);

export default WishlistModel;