import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import upload from "../config/multer.js";
import { createAlbum, searchAlbums, deleteAlbum, updateAlbum, addImageToAlbum, removeImageFromAlbum, addTagsToAlbum, removeTagFromAlbum } from "../controllers/postController.js";

const router = express.Router();

// Search route
router.get("/search", authMiddleware, searchAlbums);

// POST route สำหรับสร้างอัลบั้ม
router.post("/createAlbum", authMiddleware, ensureLoggedIn, createAlbum);

// เพิ่มรูปไปยังอัลบั้ม (field name = "image")
router.post("/:id/images", authMiddleware, ensureLoggedIn, addImageToAlbum);

// แยก endpoint สำหรับอัปโหลดไฟล์
router.post("/:id/images/upload", authMiddleware, ensureLoggedIn, upload.single("image"), addImageToAlbum);

// ลบรูปจากอัลบั้ม (และลบไฟล์/เอกสาร image)
router.delete("/:id/images/:imageId", authMiddleware, ensureLoggedIn, removeImageFromAlbum);

// DELETE /api/albums/:id
router.delete("/:id", authMiddleware, ensureLoggedIn, deleteAlbum);

// รับ PUT (form ใช้ ?_method=PUT จะถูกแปลงถ้า method-override ติดตั้งแล้ว)
router.put("/:id", authMiddleware, ensureLoggedIn, updateAlbum);

// POST add tags to album
router.post("/:id/tags", authMiddleware, ensureLoggedIn, addTagsToAlbum);

// DELETE remove a tag from album
router.delete("/:id/tags/:tagId", authMiddleware, ensureLoggedIn, removeTagFromAlbum);

export default router;
