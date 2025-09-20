import express from "express";
import multer from "multer";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import { registerUser, loginUser, logoutUser, updateProfile } from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/profile/edit", authMiddleware, ensureLoggedIn, upload.single("profileImage"), updateProfile);
router.post("/logout", authMiddleware, logoutUser);
router.get("/logout", authMiddleware, logoutUser);

export default router;
