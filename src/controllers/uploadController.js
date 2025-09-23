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

// DELETE image API
export const deleteImage = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const Image = (await import("../models/imageModel.js")).default;
    const Album = (await import("../models/albumModel.js")).default;
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing image id" });

    const image = await Image.findById(id);
    if (!image) {
      if (req.headers.accept && req.headers.accept.includes("application/json")) {
        return res.status(404).json({ error: "Image not found" });
      }
      return res.status(404).redirect("/home");
    }

    if (String(image.user) !== String(req.user._id)) {
      if (req.headers.accept && req.headers.accept.includes("application/json")) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return res.status(403).redirect("/home");
    }

    if (image.filename) {
      const filePath = path.join(process.cwd(), "uploads", image.filename);
      await fs.promises.unlink(filePath).catch(() => null);
    }

    await Album.updateMany({ images: image._id }, { $pull: { images: image._id } });
    await Image.findByIdAndDelete(image._id);

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(200).json({ ok: true });
    }
    return res.redirect("/home");
  } catch (err) {
    console.error("deleteImage error:", err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Delete failed" });
    }
    return res.status(500).redirect("/home");
  }
};

export const editImage = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing image id" });

    const image = await Image.findById(id);
    if (!image) return res.status(404).json({ error: "Image not found" });

    // ownership check
    if (String(image.user) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // update metadata
    if (typeof req.body.title !== "undefined") image.title = String(req.body.title).trim() || image.title;
    if (typeof req.body.content !== "undefined") image.content = String(req.body.content).trim();
    if (typeof req.body.status !== "undefined") image.status = String(req.body.status);

    // replace file if uploaded
    if (req.file) {
      // remove old file
      if (image.filename) {
        const oldPath = path.join(process.cwd(), "uploads", image.filename);
        await fs.promises.unlink(oldPath).catch(()=>null);
      }
      // update image doc
      image.filename = req.file.filename;
      image.originalname = req.file.originalname;
      image.imageUrl = `/uploads/${req.file.filename}`;
    }

    await image.save();

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      const fresh = await Image.findById(id).lean();
      return res.status(200).json({ ok: true, image: fresh });
    }
    // fallback redirect to image page
    return res.redirect(`/image/${id}`);
  } catch (err) {
    console.error("editImage error:", err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Update failed" });
    }
    return res.status(500).redirect(`/image/${req.params.id}`);
  }
};
