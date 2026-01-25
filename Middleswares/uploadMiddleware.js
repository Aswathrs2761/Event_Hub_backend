import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../Config/Cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // ✅ MUST be v2 instance
  params: {
    folder: "event-images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"]
  }
});
console.log("Cloudinary uploader:", cloudinary.uploader);


export const upload = multer({ storage });
