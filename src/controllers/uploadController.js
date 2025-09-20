import fs from "fs";
import path from "path";

import Image from "../models/imageModel.js";

// ฟังก์ชันอัพโหลดรูป (รวม logic ทั้งหมดไว้ที่เดียว)
export const uploadImage = async (req, res) => {
    try {
        // ตรวจล็อกอิน
        if (!req.user) {
            return res.status(401).redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
        }

        // ตรวจไฟล์และฟิลด์
        if (!req.file) {
            return res.status(400).render("upload", { error: "No file uploaded", success: null });
        }

        const { title, content, status, tags } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).render("upload", { error: "Title is required", success: null });
        }

        // ensure uploads dir
        const uploadsDir = path.resolve("uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

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

        return res.status(201).render("upload", {
            error: null,
            success: "Upload successful",
            file: {
                originalname: req.file.originalname,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                imageUrl
            }
        });
    } catch (err) {
        console.error("uploadImage error:", err);
        return res.status(500).render("upload", { error: err.message || "Upload failed", success: null });
    }
};

// ฟังก์ชันดึงรูปทั้งหมด (รวม populate user)
export const getImages = async (req, res) => {
    try {
        const images = await Image.find()
            .sort({ createdAt: -1 })
            .populate("user", "username email profilePic")
            .lean();

        return res.render("gallery", { images });
    } catch (err) {
        console.error("getImages error:", err);
        return res.status(500).send("Failed to load gallery");
    }
};
