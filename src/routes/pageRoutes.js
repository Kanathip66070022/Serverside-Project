import express from "express";
import multer from "multer";
import { showLogin, showRegister, logoutUser } from "../controllers/userController.js";
import { showUpload, showCreateAlbum, home, createAlbum, showAlbum, searchAlbums } from "../controllers/postController.js";
import { showProfile, updateProfile } from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/register", showRegister);
router.get("/login", showLogin);

// เพิ่มบรรทัดนี้ ให้ /logout ใช้งานได้จาก root
router.get("/logout", authMiddleware, logoutUser);

const ensureLoggedIn = (req, res, next) => {
  if (!req.user) {
    return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
};

// ป้องกันหน้า upload และ create album ให้ต้อง login
router.get("/upload", authMiddleware, ensureLoggedIn, showUpload);
router.get("/album/create", authMiddleware, ensureLoggedIn, showCreateAlbum);

// เพิ่ม POST /album เพื่อรับฟอร์มสร้างอัลบั้ม
router.post("/album", authMiddleware, ensureLoggedIn, createAlbum);

// เพิ่ม/ยืนยัน route /home
router.get("/home", home);

// Search route
router.get("/search", searchAlbums);

// route รายละเอียดอัลบั้ม
router.get("/album/:id", authMiddleware, ensureLoggedIn, showAlbum);

// ป้องกันหน้า profile ให้ต้อง login (ใช้ ensureLoggedIn ที่มีแล้ว)
router.get("/profile", authMiddleware, ensureLoggedIn, showProfile);

// เพิ่ม POST route สำหรับแก้ไขโปรไฟล์ (รับไฟล์ profileImage และ field name)
router.post(
  "/profile/edit",
  authMiddleware,
  ensureLoggedIn,
  upload.single("profileImage"),
  updateProfile
);

export default router;
