import mongoose from "mongoose";

export default async function dbConnect (): Promise<void>  {
  try {
 
    if (!process.env.MONGO_URI) {
      console.error(" MONGO_URI not found in .env file");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(" Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
