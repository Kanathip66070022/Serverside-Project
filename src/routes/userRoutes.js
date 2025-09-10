const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUsers } = require("../controllers/userController");
const { default: authMiddleware } = require("../middlewares/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/", authMiddleware(), getUsers);

module.exports = router;