import express from "express";

import upload from "../config/multer.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import { uploadImage, getImages, deleteImage, editImage } from "../controllers/uploadController.js";

const router = express.Router();

router.get("/gallery", getImages);               // GET  /api/upload/gallery
router.post("/", authMiddleware, upload.single("image"), uploadImage); // POST /api/upload
router.delete("/images/:id", authMiddleware, ensureLoggedIn, deleteImage); // DELETE /api/upload/images/:id

// PATCH update image metadata / replace file
router.patch("/images/:id", authMiddleware, ensureLoggedIn, upload.single("image"), editImage);

// optional alias singular
router.patch("/image/:id", authMiddleware, ensureLoggedIn, upload.single("image"), editImage);

export default router;
