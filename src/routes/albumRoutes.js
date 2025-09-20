import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import { createAlbum, searchAlbums } from "../controllers/postController.js";

const router = express.Router();

// POST route สำหรับสร้างอัลบั้ม
router.post("/createAlbum", authMiddleware, ensureLoggedIn, createAlbum);

// Search route
router.get("/search", authMiddleware, searchAlbums);

export default router;
