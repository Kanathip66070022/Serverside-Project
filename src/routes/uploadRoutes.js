import express from "express";
import multer from "multer";
import path from "path";
import { uploadImage, getImages, showUpload } from "../controllers/uploadController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")            // space -> dash
      .replace(/[^a-zA-Z0-9\-_.]/g, "")// เอาอักขระแปลก ๆ ออก
      .toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`); // 1660000000000-filename.jpg
  }
});
const upload = multer({ storage });

// Routes (แก้เป็น path เริ่มต้น เพื่อให้ mount ที่ /api/upload ทำงานที่ /api/upload)
router.get("/", showUpload);                     // GET  /api/upload
router.post("/", authMiddleware, upload.single("image"), uploadImage); // POST /api/upload
router.get("/gallery", getImages);               // GET  /api/upload/gallery

export default router;
