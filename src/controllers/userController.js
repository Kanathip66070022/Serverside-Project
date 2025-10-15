import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

import User from "../models/userModel.js";

// Register new user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password || !username) {
      return res.status(400).render("register", { error: "username, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).render("register", { error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });

    // create token and set httpOnly cookie
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // redirect to /home (or next if provided)
    const redirectTo = req.query.next || "/home";
    return res.redirect(redirectTo);
  } catch (err) {
    console.error(err);
    return res.status(500).render("register", { error: "Registration failed" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const User = (await import("../models/userModel.js")).default;
    const user = await User.findOne({ email });
    if (!user) {
      if (req.headers.accept && req.headers.accept.includes("application/json")) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      return res.status(401).render("login", { error: "Invalid credentials" });
    }

    const bcrypt = (await import("bcrypt")).default;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      if (req.headers.accept && req.headers.accept.includes("application/json")) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      return res.status(401).render("login", { error: "Invalid credentials" });
    }

    // สร้าง token / เซ็ต cookie ตามเดิม
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    return res.redirect("/home");
  } catch (err) {
    console.error("loginUser error:", err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Server error" });
    }
    return res.status(500).render("login", { error: "Server error" });
  }
};

// Logout user (clear cookie)
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  // If request expects JSON, return JSON; otherwise redirect home
  if (req.xhr || req.headers.accept?.includes("application/json")) {
    return res.json({ message: "Logged out" });
  }
  res.redirect("/home");
};

// Get users (protected)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("_id username email profilePic createdAt");
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// เพิ่ม handler สำหรับ POST /profile/edit
export const updateProfile = async (req, res) => {
  console.log("updateProfile called", {
    user: req.user ? String(req.user._id) : null,
    body: req.body,
    file: req.file && req.file.filename
  });

  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const User = (await import("../models/userModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update name / username
    if (req.body.name && String(req.body.name).trim()) {
      const newName = String(req.body.name).trim();
      user.username = newName; // keep schema-compatible
      user.name = newName;     // optional if schema has name
    }

    // Select image from gallery
    if (req.body.profileImageId) {
      const img = await Image.findById(String(req.body.profileImageId));
      if (img) user.profilePic = img._id;
    } else if (req.file) {
      // fallback: if user uploaded a new file, create Image doc and link
      const newImg = await Image.create({
        user: req.user._id,
        filename: req.file.filename,
        originalname: req.file.originalname,
        imageUrl: `/uploads/${req.file.filename}`
      });
      user.profilePic = newImg._id;
    }

    // Only save if changes detected (optional)
    await user.save();

    // For API clients return JSON
    const fresh = await User.findById(user._id).populate("profilePic").lean();
    return res.status(200).json({ ok: true, user: fresh });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ error: err.message || "update failed" });
  }
};

// เพิ่ม handler สำหรับ POST /profile/delete
export const deleteProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const User = (await import("../models/userModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;
    const Album = (await import("../models/albumModel.js")).default;

    const userId = String(req.user._id);

    // find user's images, try to remove files
    const images = await Image.find({ user: userId }).lean();
    await Promise.all(images.map(async img => {
      try {
        if (img.filename) {
          const p = path.join(process.cwd(), "uploads", img.filename);
          await fs.promises.unlink(p).catch(() => null);
        }
      } catch (_) { /* ignore */ }
    }));

    // remove image docs and albums
    await Image.deleteMany({ user: userId });
    await Album.deleteMany({ user: userId });

    // remove user
    await User.findByIdAndDelete(userId);

    // clear auth cookie
    res.clearCookie("token");

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(200).json({ ok: true });
    }
    return res.redirect("/");

  } catch (err) {
    console.error("deleteProfile error:", err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Delete failed" });
    }
    return res.status(500).redirect("/profile");
  }
};

export default { registerUser, loginUser, logoutUser, getUsers, updateProfile, deleteProfile };
