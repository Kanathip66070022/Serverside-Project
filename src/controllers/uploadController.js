import fs from "fs";
import path from "path";
import Image from "../models/imageModel.js";

// ฟังก์ชันอัพโหลดรูป
export const uploadImage = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
    }
    if (!req.file) return res.status(400).render("upload", { error: "No file uploaded", success: null });

    const { title, content, status, tags } = req.body;
    if (!title || !title.trim()) return res.status(400).render("upload", { error: "Title is required", success: null });

    // แน่ใจว่าโฟลเดอร์ uploads มีอยู่
    const uploadsDir = path.resolve("uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // สร้าง imageUrl ให้ตรงกับ static serving (app.use(express.static('uploads')))
    const imageUrl = `/uploads/${req.file.filename}`;

    const imageData = {
      user: req.user._id,
      title: title.trim(),
      content: content || "",
      imageUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      status: status || "public",
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim()).filter(Boolean)) : []
    };

    await Image.create(imageData);

    // แทนการ redirect ให้แสดงหน้า upload พร้อมข้อความสำเร็จและข้อมูลไฟล์
    return res.status(201).render("upload", {
      error: null,
      success: "Upload successful",
      file: {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        imageUrl: `/uploads/${req.file.filename}`
      }
    });
  } catch (err) {
    console.error("uploadImage error:", err);
    return res.status(500).render("upload", { error: err.message || "Upload failed", success: null });
  }
};

export const showUpload = (req, res) => {
  res.render("upload", { error: null, success: null });
};

// ฟังก์ชันดึงรูปทั้งหมด
export const getImages = async (req, res) => {
    try {
        const images = await Image.find().sort({ createdAt: -1 });
        res.render("gallery", { images });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load gallery");
    }
};
