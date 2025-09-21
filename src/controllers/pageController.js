import Image from "../models/imageModel.js";

// ฟังก์ชัน render หน้า login และ register (ใช้โดย pageRoutes)
export const showLogin = (req, res) => {
    res.render("login");
};

// ฟังก์ชัน render หน้า register
export const showRegister = (req, res) => {
    res.render("register");
};

// ฟังก์ชันแสดงหน้า home
export const home = async (req, res) => {
  try {
    const Album = (await import("../models/albumModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;

    // fetch public albums and populate owner (user) and images
    let albums = await Album.find({ status: "public" })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "username" })      // <-- populate user
      .populate({ path: "images", select: "filename imageUrl title" })
      .lean();

    // normalize cover and owner name
    albums = albums.map(a => {
      const first = Array.isArray(a.images) && a.images.length ? a.images[0] : null;
      const cover = first ? (first.imageUrl || (`/uploads/${first.filename}`)) : "/images/default-cover.jpg";
      const ownerName = (a.user && a.user.username) ? a.user.username : (a.owner || "Unknown");
      return { ...a, cover, owner: ownerName };
    });

    return res.render("home", { albums });
  } catch (err) {
    console.error("home error:", err);
    return res.status(500).render("home", { albums: [] });
  }
};

// ฟังก์ชัน render หน้า profile
export const showProfile = async (req, res) => {
  try {
    if (!req.user) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);

    const User = (await import("../models/userModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;
    const Album = (await import("../models/albumModel.js")).default;

    // ดึง user ใหม่จาก DB และ populate profilePic
    const freshUser = await User.findById(req.user._id)
      .populate({ path: "profilePic", select: "filename imageUrl title" })
      .lean();

    const gallery = await Image.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("filename originalname imageUrl title")
      .lean();

    let albums = await Album.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "images", select: "filename imageUrl title" })
      .lean();

    albums = albums.map(a => {
      const first = Array.isArray(a.images) && a.images.length ? a.images[0] : null;
      const cover = first ? (first.imageUrl || `/uploads/${first.filename}`) : "/images/default-cover.jpg";
      return { ...a, cover };
    });

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

// ฟังก์ชันแสดงหน้าอัพโหลด
export const showUpload = (req, res) => {
    res.render("upload", { error: null, success: null });
};

// ฟังก์ชันแสดงหน้ารายละเอียดรูปภาพ
export const showImage = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send("Missing id");

    const image = await Image.findById(id)
      .populate("user", "username profilePic")
      .lean();

    if (!image) return res.status(404).send("Image not found");

    return res.render("image", { image, currentUser: req.user || null });
  } catch (err) {
    console.error("showImage error:", err);
    return res.status(500).send("Server error");
  }
};

// ฟังก์ชันแสดงหน้าสร้างอัลบั้ม
export const showCreateAlbum = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
        }

        const Image = await import("../models/imageModel.js");
        const images = await Image.default.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select("filename originalname title _id");

        // Check for success query param
        const success = req.query.success === "1" ? "Album created successfully!" : null;

        res.render("createAlbum", {
            images,
            error: null,
            success: success
        });

    } catch (err) {
        console.error("showCreateAlbum error:", err);
        res.status(500).render("createAlbum", {
            images: [],
            error: "Failed to load images",
            success: null
        });
    }
};

// แสดงหน้าอัลบั้ม (GET /album/:id)
export const showAlbum = async (req, res) => {
    try {
        const Album = (await import("../models/albumModel.js")).default;
        const album = await Album.findById(req.params.id)
            .populate({
                path: "images",
                select: "_id filename originalname title content imageUrl"
            })
            .populate({ path: "user", select: "username" })
            .lean();

        if (!album) {
            return res.status(404).redirect("/home");
        }

        const photos = (album.images || []).map(img => ({
            id: img._id,
            filename: img.filename,
            title: img.title || img.originalname || "",
            content: img.content || "",
            imageUrl: img.imageUrl || `/uploads/${img.filename}`
        }));

        // ส่ง object ที่ view คาดหวัง (album.photos)
        return res.render("album", {
            album: {
                ...album,
                photos
            },
            user: req.user || null
        });
    } catch (err) {
        console.error("showAlbum error:", err);
        return res.status(500).render("album", {
            album: { title: "Error", content: "", photos: [] },
            user: req.user || null
        });
    }
};
