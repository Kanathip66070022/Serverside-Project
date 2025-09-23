import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import { showProfile, showImage } from "../controllers/pageController.js";
import { showLogin, showRegister, showUpload, showCreateAlbum, showAlbum, home, editAlbumPage, editImagePage } from "../controllers/pageController.js";

const router = express.Router();

router.get("/register", showRegister);
router.get("/login", showLogin);
router.get("/home", home);
router.get("/profile", authMiddleware, ensureLoggedIn, showProfile);
router.get("/upload", authMiddleware, ensureLoggedIn, showUpload);
router.get("/image/:id", authMiddleware, ensureLoggedIn, showImage);
router.get("/album/create", authMiddleware, ensureLoggedIn, showCreateAlbum);
router.get("/album/:id", authMiddleware, ensureLoggedIn, showAlbum);
router.get("/album/:id/edit", authMiddleware, ensureLoggedIn, editAlbumPage);
router.get("/image/:id/edit", authMiddleware, ensureLoggedIn, editImagePage);

export default router;
