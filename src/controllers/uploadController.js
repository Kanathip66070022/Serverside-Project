import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

import Image from "../models/imageModel.js";

const s3 = new S3Client({ region: process.env.S3_REGION || process.env.AWS_REGION });
function buildPublicUrlFromKey(key) {
  const base =
    process.env.S3_PUBLIC_URL_BASE ||
    `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION || process.env.AWS_REGION}.amazonaws.com`;
  return key ? `${base}/${key}` : null;
}

export const uploadImage = async (req, res) => {
  try {
    const { title = "", content = "", tags, albumId } = req.body;
    const f = req.file; // จาก multer-s3

    // ดึงค่า S3 จาก req.file
    let imageUrl = f?.location || null;   // URL สาธารณะ
    const filename = f?.key || null;      // S3 object key
    const fileId = null;                  // ไม่ใช้ GridFS แล้ว

    // ถ้าไม่มี location ให้สร้าง URL เอง (เช่นใช้ CloudFront)
    if (!imageUrl && filename) {
      const base =
        process.env.S3_PUBLIC_URL_BASE ||
        `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`;
      imageUrl = `${base}/${filename}`;
    }

    const doc = await Image.create({
      title,
      content,
      imageUrl,
      filename,     // เก็บ key ไว้เพื่อลบ/แก้ไขภายหลัง
      fileId,       // คงเป็น null
      user: req.user?._id || null,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : [])
    });

    // แนบกับอัลบั้มถ้ามี
    if (albumId) {
      const Album = (await import("../models/albumModel.js")).default;
      await Album.findByIdAndUpdate(albumId, { $addToSet: { images: doc._id } });
    }

    // ตอบกลับ
    if (req.headers.accept?.includes("application/json")) {
      return res.status(201).json(doc);
    }
    return res.redirect(`/image/${doc._id}`);
  } catch (err) {
    console.error("uploadImage error:", err);
    if (req.headers.accept?.includes("application/json")) {
      return res.status(500).json({ error: "Upload failed" });
    }
    return res.status(500).render("upload", { error: "Upload failed" });
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

    if (String(image.user) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // metadata
    if (typeof req.body.title !== "undefined") image.title = String(req.body.title).trim() || image.title;
    if (typeof req.body.content !== "undefined") image.content = String(req.body.content).trim();
    if (typeof req.body.status !== "undefined") image.status = String(req.body.status);

    // replace file if uploaded
    if (req.file) {
      // ลบไฟล์เก่า (S3 ถ้ามีบัคเก็ต, ไม่งั้นลบไฟล์โลคัล)
      if (image.filename && process.env.S3_BUCKET) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: image.filename }));
        } catch (_) {}
      } else if (image.filename) {
        const oldPath = path.join(process.cwd(), "uploads", image.filename);
        await fs.promises.unlink(oldPath).catch(() => null);
      }

      // map จาก multer-s3
      const f = req.file;
      const key = f.key || f.filename;              // key สำหรับ S3, เผื่อกรณีใช้ disk
      const url = f.location || buildPublicUrlFromKey(key);

      image.filename = key || image.filename;       // เก็บ key ไว้สำหรับลบ/แก้ไข
      image.imageUrl = url || image.imageUrl;       // URL สาธารณะ
      image.fileId = null;                          // ไม่ใช้ GridFS แล้ว
      image.originalname = f.originalname || image.originalname;
      image.contentType = f.mimetype || image.contentType;
    }

    await image.save();

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      const fresh = await Image.findById(id).lean();
      return res.status(200).json({ ok: true, image: fresh });
    }
    return res.redirect(`/image/${id}`);
  } catch (err) {
    console.error("editImage error:", err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Update failed" });
    }
    return res.status(500).redirect(`/image/${req.params.id}`);
  }
};
