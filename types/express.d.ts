import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      id: string ; 
   role: "customer" | "seller" | "admin";    }
  }
}
