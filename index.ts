import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import dbConnect from "./config/dbConnect";
import AuthRoute from "./routes/authRoute";
import productRoutes from "./routes/productRoute";
import cartRoutes from "./routes/cartRoute";
import wishlistRoutes from "./routes/WishlistRoute";
import addressRoutes from "./routes/addressRoute";
import userRoutes from "./routes/userRoute";
import orderRoutes from "./routes/orderRoute";
import sellerRoutes from "./routes/sellerRoute";
import "./strategy/goggleStrategy";
import passport from "passport";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import logger from "./logger";
import morgan from "morgan"

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8000;



const corsOption = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
app.set("trust proxy", 1);
app.use(cors(corsOption));
app.use(helmet());
app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

 const morganMiddleware = morgan(
  "combined",
  { stream }
);

type LimiterOptions = {
  max: number;
  prefix: string;
  message: string;
};

const createLimiter = ({ max, prefix, message }: LimiterOptions) =>
  rateLimit({
    
    windowMs: 60 * 1000,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });

const authLimiter = createLimiter({
  max: 100,
  prefix: "rl:auth:",
  message: "Too many login attempts, try again after 1 minute",
});

const orderLimiter = createLimiter({
  max: 200,
  prefix: "rl:order:",
  message: "Too many orders, slow down!",
});

const generalLimiter = createLimiter({
  max: 1000,
  prefix: "rl:general:",
  message: "Too many requests!",
});

const userLimiter = createLimiter({
  max: 300,
  prefix: "rl:user:",
  message: "Too many requests!",
});
app.use(morganMiddleware)

app.use("/api/auth", authLimiter, AuthRoute);
app.use("/api/products", generalLimiter, productRoutes);
app.use("/api/cart", generalLimiter, cartRoutes);
app.use("/api/wishlist", generalLimiter, wishlistRoutes);
app.use("/api/address", userLimiter, addressRoutes);
app.use("/api/user", userLimiter, userRoutes);
app.use("/api/order", orderLimiter, orderRoutes);
app.use("/api/seller", sellerRoutes);



const start = async () => {
  try {
    await dbConnect();
    app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
};

start();


