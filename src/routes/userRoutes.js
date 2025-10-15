import express from "express";
import multer from "multer";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import { registerUser, loginUser, logoutUser, updateProfile, deleteProfile } from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/register", registerUser);
router.post("/login", loginUser);

// PATCH route สำหรับอัปเดตโปรไฟล์ผู้ใช้ (เช่น ชื่อ, รูปโปรไฟล์)
router.patch("/profile", authMiddleware, ensureLoggedIn, upload.single("profileImage"), updateProfile);

// RESTful delete profile
router.delete("/profile", authMiddleware, ensureLoggedIn, deleteProfile);

// GET = convenient link (redirect back to home)
router.get("/logout", authMiddleware, logoutUser);

// POST = safer, for forms / AJAX / API 
router.post("/logout", authMiddleware, logoutUser);

export default router;
/**
 * @openapi
 * /api/users/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthRegisterRequest' }
 *     responses:
 *       200:
 *         description: Registered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Duplicate user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
/**
 * @openapi
 * /api/users/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthLoginRequest' }
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: Bad credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
