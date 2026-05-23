import multer from "multer";
import { v2 as cloudinary, UploadApiOptions } from "cloudinary";




cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});


export const uploadToCloudinary = (
  fileBuffer: Buffer
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "Bookart/books", 
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

 export const multerMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per image
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
}).array("images", 6);
 //images is the form input name
//Take eg when a large user set upload at same time then ram will exhaust so we upload the images on disk
//we use s3 of aws if we deployed our server on aws
