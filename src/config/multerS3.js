import "dotenv/config";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";

const s3 = new S3Client({
  region: process.env.S3_REGION || process.env.AWS_REGION,
  // ปล่อยให้ AWS SDK ดึงคีย์จาก ENV เอง (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
});

function safeName(originalname) {
  const ext = path.extname(originalname);
  const base = path
    .basename(originalname, ext)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_.]/g, "")
    .toLowerCase();
  return `${Date.now()}-${base}${ext}`;
}

const bucket = process.env.S3_BUCKET || process.env.AWS_BUCKET_NAME;
if (!bucket) {
  throw new Error("S3_BUCKET (or AWS_BUCKET_NAME) is not set in .env");
}

const storage = multerS3({
  s3,
  bucket,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
  key: (req, file, cb) => cb(null, `uploads/${safeName(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;