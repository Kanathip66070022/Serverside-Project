import express from "express";

import upload from "../config/multer.js";
import authMiddleware from "../middlewares/authMiddleware.js";

import { uploadImage, getImages } from "../controllers/uploadController.js";

const router = express.Router();

router.get("/gallery", getImages);               // GET  /api/upload/gallery
router.post("/", authMiddleware, upload.single("image"), uploadImage); // POST /api/upload

export default router;
