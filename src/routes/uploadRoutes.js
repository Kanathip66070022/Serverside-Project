const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadImage, getImages } = require("../controllers/uploadController");

const router = express.Router();

// กำหนด storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // ตรงนี้คุณใช้ app.use(express.static("uploads")) แล้ว โอเค
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Routes
router.post("/", upload.single("image"), uploadImage);
router.get("/", getImages);

module.exports = router;   // ✅ ต้อง export router เท่านั้น
