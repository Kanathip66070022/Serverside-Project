// routes/pageRoutes.js
const express = require("express");
const router = express.Router();
const { showLogin, showRegister } = require("../controllers/userController");
const { showUpload, showCreateAlbum, home } = require("../controllers/postController");

router.get("/register", showRegister);
router.get("/login", showLogin);
router.get("/upload", showUpload);
router.get("/albums", showCreateAlbum);
router.get("/home", home);

module.exports = router;
