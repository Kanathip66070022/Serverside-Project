import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import { showProfile, showImage } from "../controllers/pageController.js";
import { showLogin, showRegister, showUpload, showCreateAlbum, showAlbum, home, editAlbumPage, editImagePage, showTags, showTagAlbums } from "../controllers/pageController.js";

const router = express.Router();

// redirect root to /home
router.get('/', (req, res) => res.redirect('/home'));

router.get("/register", showRegister);
router.get("/login", showLogin);
router.get("/home", home);

// add tags page
router.get("/tags", showTags);
// เพิ่มเส้นทางสำหรับดูอัลบั้มของ tag
router.get("/tags/:id", showTagAlbums);

router.get("/profile", authMiddleware, ensureLoggedIn, showProfile);
router.get("/upload", authMiddleware, ensureLoggedIn, showUpload);
router.get("/image/:id", authMiddleware, ensureLoggedIn, showImage);
router.get("/album/create", authMiddleware, ensureLoggedIn, showCreateAlbum);
router.get("/album/:id", authMiddleware, ensureLoggedIn, showAlbum);
router.get("/album/:id/edit", authMiddleware, ensureLoggedIn, editAlbumPage);
router.get("/image/:id/edit", authMiddleware, ensureLoggedIn, editImagePage);

export default router;
