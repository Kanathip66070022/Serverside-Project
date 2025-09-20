import express from "express";
import { registerUser, loginUser, getUsers, logoutUser } from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.get("/logout", authMiddleware, logoutUser); // เพิ่มบรรทัดนี้ เพื่อให้ <a href="/logout"> ใช้งานได้ (redirect/clear cookie handled by logoutUser)

router.get("/", authMiddleware, getUsers);

export default router;