import multer from "multer";
import path from "path";

// กำหนด storage ว่าจะเก็บที่ไหนและตั้งชื่อไฟล์ยังไง
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // เก็บในโฟลเดอร์ /uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
    // เช่น 1694701231234.png
  }
});

// สร้าง middleware upload
const upload = multer({ storage });
