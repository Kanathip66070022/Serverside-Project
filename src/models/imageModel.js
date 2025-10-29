import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ""
  },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files", required: false },
  filename: { type: String },
  imageUrl: { type: String },
  contentType: {
    type: String
  },
  status: {
    type: String, enum: ["public", "private"], default: "public"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", required: true
  },
}, { timestamps: true });

// อย่างน้อยต้องมีหนึ่งในสาม: fileId | filename | imageUrl
ImageSchema.pre("validate", function (next) {
  if (!this.fileId && !this.filename && !this.imageUrl) {
    this.invalidate("fileId", "At least one of fileId, filename or imageUrl is required");
  }
  next();
});

export default mongoose.models.Image || mongoose.model("Image", ImageSchema);
