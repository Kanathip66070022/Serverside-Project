import express from "express";
import multer from "multer";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import { registerUser, loginUser, logoutUser, updateProfile } from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/register", registerUser);
router.post("/login", loginUser);

// PATCH route สำหรับอัปเดตโปรไฟล์ผู้ใช้ (เช่น ชื่อ, รูปโปรไฟล์)
router.patch("/profile", authMiddleware, ensureLoggedIn, upload.single("profileImage"), updateProfile);

// GET = convenient link (redirect back to home)
router.get("/logout", authMiddleware, logoutUser);

// POST = safer, for forms / AJAX / API 
router.post("/logout", authMiddleware, logoutUser);

export default router;
