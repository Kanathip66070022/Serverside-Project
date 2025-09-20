import Image from "../models/imageModel.js";
import User from "../models/userModel.js";
import Album from "../models/albumModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ฟังก์ชันอัพโหลดรูป
export const uploadImage = async (req, res) => {
  try {
    const { title, content } = req.body;
    const imageUrl = "/uploads/" + req.file.filename;

    // สมมติว่ามี req.user._id จากระบบ auth (เช่น JWT / session)
    const userId = req.user?._id; // ⚠️ ต้องมี middleware ที่ set req.user
    if (!userId) {
      return res.status(401).send("Unauthorized: No user");
    }

    const newImage = new Image({
      title,
      content,
      imageUrl,
      user: userId
    });

    await newImage.save();
    res.redirect("/gallery");
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
};

// ฟังก์ชัน render หน้า upload
export const showUpload = (req, res) => {
  res.render("upload");
};

// ฟังก์ชันดึงรูปทั้งหมด
export const getImages = async (req, res) => {
  try {
    // populate user เพื่อดึงข้อมูลเจ้าของรูป
    const images = await Image.find()
      .sort({ createdAt: -1 })
      .populate("user", "username email profilePic");

    res.render("gallery", { images });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load gallery");
  }
};

// ฟังก์ชัน render หน้า login และ register (ใช้โดย pageRoutes)
export const showLogin = (req, res) => {
  res.render("login");
};

export const showRegister = (req, res) => {
  res.render("register");
};

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
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).render("login", { error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).render("login", { error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    // ตั้ง httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // redirect ไป /home เว้นแต่มี ?next=...
    const redirectTo = req.query.next || "/home";
    return res.redirect(redirectTo);
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).render("login", { error: "Login failed" });
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

// ฟังก์ชัน render หน้า profile
export const showProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
    }

    const User = (await import("../models/userModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;
    const Album = (await import("../models/albumModel.js")).default;

    // ดึง user ใหม่จาก DB เพื่อให้ได้ค่าล่าสุด
    const freshUser = await User.findById(req.user._id).lean();

    // gallery = รูปของ user
    const gallery = await Image.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("filename originalname imageUrl title")
      .lean();

    // albums ของ user พร้อม populate images
    let albums = await Album.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "images",
        select: "filename imageUrl title"
      })
      .lean();

    // คำนวณ cover ของแต่ละอัลบั้ม (ใช้รูปแรกเป็น cover หรือ fallback)
    albums = albums.map(a => {
      const first = Array.isArray(a.images) && a.images.length ? a.images[0] : null;
      const cover = first ? (first.imageUrl || `/uploads/${first.filename}`) : "/images/default-cover.jpg";
      return { ...a, cover };
    });

    // ส่งข้อมูลทั้งหมดให้ view (มั่นใจว่า albums ส่งเป็น array เสมอ)
    return res.render("profile", {
      user: freshUser || req.user,
      gallery,
      albums
    });
  } catch (err) {
    console.error("showProfile error:", err);
    return res.status(500).render("profile", { user: req.user || null, gallery: [], albums: [] });
  }
};

// เพิ่ม handler สำหรับ POST /profile/edit
export const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
    }

    const User = (await import("../models/userModel.js")).default;
    const user = await User.findById(req.user._id);
    if (!user) return res.redirect("/login");

    // อัปเดตชื่อถ้ามี
    if (req.body.name && String(req.body.name).trim()) {
      user.name = String(req.body.name).trim();
    }

    // อัปเดตรูปโปรไฟล์ถ้ามีไฟล์
    if (req.file) {
      // เก็บเป็น public path ที่ views ใช้ได้ตรง ๆ
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();
    return res.redirect("/profile");
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).redirect("/profile");
  }
};

export default { uploadImage, showUpload, getImages, showLogin, showRegister, registerUser, loginUser, logoutUser, getUsers, showProfile, updateProfile };
