import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import Image from "../models/imageModel.js";

// ฟังก์ชันอัพโหลดรูป (GridFS)
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).render("upload", { error: "กรุณาเลือกไฟล์!", success: null, file: null });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: {
        uploadedBy: req.user ? String(req.user._id) : null,
        originalname: req.file.originalname
      }
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", async () => {
      try {
        const doc = await Image.create({
          title: req.body.title || req.file.originalname || "Untitled",
          content: req.body.content || "",
          fileId: uploadStream.id,
          filename: uploadStream.filename || req.file.originalname,
          contentType: req.file.mimetype,
          status: req.body.status || "public",
          user: req.user?._id
        });

        return res.status(200).render("upload", {
          error: null,
          success: "อัปโหลดสำเร็จ!",
          file: { imageUrl: `/files/${doc.fileId}`, originalname: doc.filename }
        });
      } catch (e) {
        console.error("save image doc error:", e);
        return res.status(500).render("upload", { error: "เกิดข้อผิดพลาด!", success: null, file: null });
      }
    });

    uploadStream.on("error", (err) => {
      console.error("GridFS upload error:", err);
      return res.status(500).render("upload", { error: "อัปโหลดล้มเหลว!", success: null, file: null });
    });
  } catch (err) {
    console.error("uploadImage error:", err);
    return res.status(500).render("upload", { error: "เกิดข้อผิดพลาดในระบบ!", success: null, file: null });
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

// แก้ไขข้อมูลรูปภาพ (title, content, status, เปลี่ยนไฟล์)
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
        await fs.promises.unlink(oldPath).catch(() => null);
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
