import mongoose, { CallbackError, Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import "./Address";

export interface USER extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  profilePicture?: string | null;
  phoneNumber?: string | null;
  isVerified?: boolean;
  verificationToken?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  verificationTokenExpires?: Date | null;
  role: "customer" | "seller" | "admin";
  agreeTerms?: boolean;
  addresses?: mongoose.Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<USER>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name must be less than 50 characters"],
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => validator.isEmail(v),
        message: "Please provide a valid email address",
      },
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],

      validate: {
        validator: function (this: USER, v: string) {
          if (!v && this.googleId) return true;

          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v);
        },

        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      },
    },

    googleId: {
      type: String,
    },

    profilePicture: {
      type: String,
      default: null,
    },

    phoneNumber: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      default: null,
    },

    verificationTokenExpires: {
      type: Date,
      default: null,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    agreeTerms: {
      type: Boolean,
      default: false,
    },

    addresses: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Address",
      },
    ],

    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
  },

  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    return next();
  } catch (err) {
    return next(err as CallbackError);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const UserModel =
  (mongoose.models.User as mongoose.Model<USER>) ||
  mongoose.model<USER>("User", userSchema);

export default UserModel;
{/*
  A Mongoose model is a JavaScript object stored in RAM, not in MongoDB.

It is kept inside mongoose.models in memory.

When Next.js restarts, the server restarts and RAM is cleared, so old models are removed. There is no memory waste.

In Next.js dev mode (hot reload) or serverless functions, your code files may reload multiple times without restarting the process.

Each reload re‑executes your schema definition file


The real problem is trying to define the same model again, which causes an OverwriteModelError.

To avoid this, you first check if the model already exists and reuse it, otherwise you create it.

One line takeaway
Models exist only in memory and reset on restart. The issue is not memory usage but redefining the same model.*/}


// import mongoose, { CallbackError, Document, Schema } from "mongoose";
// import bcrypt from "bcryptjs";
// import "./Address";

// export interface USER extends Document {
//   name: string;
//   email: string;
//   password?: string;
//   googleId?: string;
//   profilePicture?: string | null;
//   phoneNumber?: string | null;
//   isVerified?: boolean;
//   verificationToken?: string | null;
//   resetPasswordToken?: string | null;
//   resetPasswordExpires?: Date | null;
//   verificationTokenExpires?: Date | null;
//    role: "customer" | "seller" | "admin";
//   agreeTerms?: boolean;
//   addresses?: mongoose.Types.ObjectId[]; // references to Address docs
//   comparePassword(candidatePassword: string): Promise<boolean>; // instance method
// }

// const userSchema = new Schema<USER>(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String },
//     googleId: { type: String },
//     profilePicture: { type: String, default: null },
//     phoneNumber: { type: String, default: null },
//     isVerified: { type: Boolean, default: false },
//     verificationToken: { type: String, default: null },
//     verificationTokenExpires: { type: Date, default: null },
//     resetPasswordToken: { type: String, default: null },
//     resetPasswordExpires: { type: Date, default: null },
//     agreeTerms: { type: Boolean, default: false },
//     addresses: [{ type: mongoose.Types.ObjectId, ref: "Address" }],
//     role: {type: String,enum: ["customer", "seller", "admin"],default: "customer",},
//   },
//   { timestamps: true },
// );

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   try {
//     const salt = await bcrypt.genSalt(10); //prevents rainbow table attacks
//     this.password = await bcrypt.hash(this.password!, salt);
//     //this.password! → non‑null assertion (will tell ts that password is here definitely ).
//     return next();
//   } catch (err) {
//     return next(err as CallbackError);
//   }
// });

// userSchema.methods.comparePassword = async function (
//   candidatePassword: string,
// ): Promise<boolean> {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// const UserModel =
//   (mongoose.models.User as mongoose.Model<USER>) ||
//   mongoose.model<USER>("User", userSchema);

// export default UserModel;