import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true },
  content: { 
    type: String, 
    default: "" },
  fileId: { 
    type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS _id
  filename: { 
    type: String 
  },
  contentType: { 
    type: String 
  },
  status: { 
    type: String, enum: ["public", "private"], default: "public" 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, ref: "User", required: true 
  },
  createdAt: { 
    type: Date, default: Date.now 
  }
});

export default mongoose.models.Image || mongoose.model("Image", imageSchema);
