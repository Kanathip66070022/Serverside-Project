import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Image from "../models/imageModel.js";

export async function migrateDiskImagesToGridFS() {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    console.log("[migrate] uploads directory not found, skip.");
    return;
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });

  const legacyImages = await Image.find({
    $or: [
      { fileId: { $exists: false } },
      { fileId: null }
    ],
    $or: [
      { imageUrl: { $exists: true, $ne: null } },
      { filename: { $exists: true, $ne: null } }
    ]
  }).limit(200);

  if (!legacyImages.length) {
    console.log("[migrate] no legacy images to process.");
    return;
  }

  console.log(`[migrate] found ${legacyImages.length} legacy images.`);

  for (const img of legacyImages) {
    try {
      const fname = img.filename || (img.imageUrl ? path.basename(img.imageUrl) : null);
      if (!fname) continue;
      const fullPath = path.join(uploadDir, fname);
      if (!fs.existsSync(fullPath)) {
        console.warn("[migrate] file missing:", fullPath);
        continue;
      }

      // Skip if already migrated somehow
      if (img.fileId) continue;

      await new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(fname, {
          contentType: img.contentType || "image/*",
          metadata: {
            migrated: true,
            originalname: fname,
            legacy: true
          }
        });
        fs.createReadStream(fullPath)
          .on("error", reject)
          .pipe(uploadStream)
          .on("error", reject)
          .on("finish", async () => {
            img.fileId = uploadStream.id;
            img.filename = uploadStream.filename;
            // optional: remove old imageUrl field if you want
            // img.imageUrl = undefined;
            await img.save();
            resolve();
          });
      });

      console.log("[migrate] migrated:", fname);
    } catch (e) {
      console.error("[migrate] error:", e);
    }
  }

  console.log("[migrate] done.");
}