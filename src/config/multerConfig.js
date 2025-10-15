import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg","image/png","image/gif","image/webp","image/avif"].includes(file.mimetype);
    cb(ok ? null : new Error("Invalid file type"), ok);
  }
});

export default upload;