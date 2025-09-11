// routes/pageRoutes.js
const express = require("express");
const router = express.Router();
const { showLogin, showRegister } = require("../controllers/userController");

router.get("/register", showRegister);
router.get("/login", showLogin);

module.exports = router;
