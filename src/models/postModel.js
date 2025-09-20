import mongoose from "mongoose";
import Counter from "./counterModel.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const postSchema = new mongoose.Schema({
  postId: { type: Number, unique: true }, // auto increment PK
  username: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // FK
  //userId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["public", "private"], default: "public" },
  tags: [{ type: String }]
});

// Auto-increment postId
postSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "postId" },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );
    this.postId = counter.sequenceValue;
  }
  next();
});

const Post = mongoose.model("Post", postSchema);

// ✨ เพิ่มฟังก์ชันสำหรับแสดงหน้า login/register
export const showLogin = (req, res) => {
  res.render("login");
};

export const showRegister = (req, res) => {
  res.render("register");
};

// ฟังก์ชันอื่นๆ ที่มีอยู่แล้ว...
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  // ... existing login code ...
};

// ... other existing functions ...

export default Post;