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

    const rawSort = String(req.query.sort || "latest");
    const sort = ["latest", "oldest", "title", "owner"].includes(rawSort) ? rawSort : "latest";
    const sortStage = sort === "oldest" ? { createdAt: 1 }
      : sort === "title" ? { title: 1, createdAt: -1 }
        : sort === "owner" ? { "user.username": 1, createdAt: -1 }
          : { createdAt: -1 };

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = 4; // แสดง 4 อัลบั้มต่อหน้าเสมอ

    const total = await Album.countDocuments({ status: "public" });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    const albumsRaw = await Album.find({ status: "public" })
      .populate({ path: "images", select: "fileId filename imageUrl" })
      .populate({ path: "user", select: "username name" })
      .sort(sortStage)
      .skip((safePage - 1) * limit)
      .limit(limit)
      .lean();

    const albums = albumsRaw.map(a => {
      let cover = "/images/default-cover.jpg";
      if (a.images && a.images[0]) {
        const i0 = a.images[0];
        if (i0.fileId) cover = `/files/${i0.fileId}`;
        else if (i0.imageUrl) cover = i0.imageUrl;
        else if (i0.filename) cover = `/uploads/${encodeURIComponent(i0.filename)}`;
      } else if (a.cover) {
        cover = a.cover.startsWith("/") ? a.cover : `/uploads/${encodeURIComponent(a.cover)}`;
      }
      return { ...a, cover, owner: (a.user && (a.user.name || a.user.username)) || "Unknown" };
    });

    let myAlbums = [];
    if (req.user) {
      myAlbums = await Album.find({ user: req.user._id })
        .populate({ path: "images", select: "fileId filename imageUrl" })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      myAlbums = myAlbums.map(a => {
        let cover = "/images/default-cover.jpg";
        if (a.images && a.images[0]) {
          const i0 = a.images[0];
          if (i0.fileId) cover = `/files/${i0.fileId}`;
          else if (i0.imageUrl) cover = i0.imageUrl;
          else if (i0.filename) cover = `/uploads/${encodeURIComponent(i0.filename)}`;
        } else if (a.cover) {
          cover = a.cover.startsWith("/") ? a.cover : `/uploads/${encodeURIComponent(a.cover)}`;
        }
        return { ...a, cover };
      });
    }

    return res.render("home", {
      albums, myAlbums, user: req.user,
      currentPage: safePage, totalPages, sort,
      perPage: limit,
      isSearch: false
    });
  } catch (err) {
    console.error("home error:", err);
    return res.status(500).render("home", {
      albums: [],
      currentPage: 1,
      totalPages: 1,
      user: req.user,
      myAlbums: [],
      sort: "latest",
      perPage: 4
    });
  }
};

// ฟังก์ชัน render หน้า profile
export const showProfile = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const User = (await import("../models/userModel.js")).default;
    const Album = (await import("../models/albumModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;

    const freshUser = await User.findById(req.user._id)
      .populate({ path: "profilePic", select: "fileId filename imageUrl" })
      .lean();

    // Build profilePicSrc
    if (freshUser && freshUser.profilePic) {
      const p = freshUser.profilePic;
      let src = "/images/default-avatar.png";
      if (p.fileId) src = `/files/${p.fileId}`;
      else if (p.imageUrl) src = p.imageUrl;
      else if (p.filename) src = `/uploads/${encodeURIComponent(p.filename)}`;
      freshUser.profilePicSrc = src;
    } else if (freshUser) {
      freshUser.profilePicSrc = "/images/default-avatar.png";
    }

    // Gallery with src
    let gallery = await Image.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("title fileId filename imageUrl")
      .lean();

    gallery = gallery.map(g => {
      let src = "/images/default-cover.jpg";
      if (g.fileId) src = `/files/${g.fileId}`;
      else if (g.imageUrl) src = g.imageUrl;
      else if (g.filename) src = `/uploads/${encodeURIComponent(g.filename)}`;
      return { ...g, src };
    });

    // Albums + first image cover
    let albums = await Album.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "images", select: "fileId filename imageUrl title" })
      .lean();

    albums = albums.map(a => {
      let cover = "/images/default-cover.jpg";
      if (a.images && a.images[0]) {
        const f = a.images[0];
        if (f.fileId) cover = `/files/${f.fileId}`;
        else if (f.imageUrl) cover = f.imageUrl;
        else if (f.filename) cover = `/uploads/${encodeURIComponent(f.filename)}`;
      } else if (a.cover) {
        cover = a.cover.startsWith("/") ? a.cover : `/uploads/${encodeURIComponent(a.cover)}`;
      }
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
    const Tag = (await import("../models/tagModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;

    const tags = (await Tag.find().select("title").lean()) || [];
    tags.forEach(t => { t.name = t.title; });

    let images = [];
    if (req.user) {
      images = await Image.find({ user: req.user._id })
        .select("title originalname filename imageUrl")
        .sort({ createdAt: -1 })
        .lean();
    }

    return res.render("createAlbum", { user: req.user, tags, images, currentPath: req.path });
  } catch (err) {
    console.error("showCreateAlbum error:", err);
    return res.status(500).redirect("/home");
  }
};

// แสดงหน้าอัลบั้ม (GET /album/:id)
export const showAlbum = async (req, res) => {
  try {
    const Album = (await import("../models/albumModel.js")).default;

    const album = await Album.findById(req.params.id)
      .populate({ path: "user", select: "username name" })
      .populate({ path: "images", select: "fileId filename imageUrl title content createdAt" })
      .populate({ path: "tags", select: "title" })
      .lean();

    if (!album) return res.status(404).render("404");

    // เตรียม cover + src ให้แต่ละรูป
    if (Array.isArray(album.images)) {
      album.images = album.images.map(img => {
        let src = "/images/default-cover.jpg";
        if (img.fileId) src = `/files/${img.fileId}`;
        else if (img.imageUrl) src = img.imageUrl;
        else if (img.filename) src = `/uploads/${img.filename}`;
        return { ...img, src };
      });
    } else {
      album.images = [];
    }

    let cover = "/images/default-cover.jpg";
    if (album.images[0]) cover = album.images[0].src;
    album.cover = cover;

    album.user = album.user || {};
    album.user.name = album.user.name || album.user.username || "Unknown";

    album.tags = (album.tags || []).map(t => {
      if (!t) return null;
      if (typeof t === "string") return { _id: t, title: t };
      if (t.title) return t;
      if (t._id) return { _id: t._id, title: String(t._id) };
      return null;
    }).filter(Boolean);

    return res.render("album", { album, user: req.user || null });
  } catch (err) {
    console.error("showAlbum error:", err);
    return res.status(500).render("album", { album: null, user: req.user || null });
  }
};

// ฟังก์ชันแสดงหน้าแก้ไขอัลบั้ม
export const editAlbumPage = async (req, res) => {
  try {
    const Album = (await import("../models/albumModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;
    const Tag = (await import("../models/tagModel.js")).default;
    const id = req.params.id;

    const album = await Album.findById(id)
      .populate({ path: "images", select: "fileId filename imageUrl title user" })
      .populate({ path: "user", select: "username name" })
      .populate({ path: "tags", select: "title" })
      .lean();

    if (!album) return res.status(404).render("404");

    // สร้าง src ให้รูปในอัลบั้ม
    if (Array.isArray(album.images)) {
      album.images = album.images.map(img => {
        let src = "/images/default-cover.jpg";
        if (img.fileId) src = `/files/${img.fileId}`;
        else if (img.imageUrl) src = img.imageUrl;
        else if (img.filename) src = `/uploads/${encodeURIComponent(img.filename)}`;
        return { ...img, src };
      });
    }

    const currentUserId = req.user ? String(req.user._id) : null;
    const excludeIds = Array.isArray(album.images) ? album.images.map(i => String(i._id || i)) : [];

    let availableImages = [];
    if (currentUserId) {
      availableImages = await Image.find({ user: currentUserId, _id: { $nin: excludeIds } })
        .select("title fileId filename imageUrl")
        .sort({ createdAt: -1 })
        .lean();

      availableImages = availableImages.map(img => {
        let src = "/images/default-cover.jpg";
        if (img.fileId) src = `/files/${img.fileId}`;
        else if (img.imageUrl) src = img.imageUrl;
        else if (img.filename) src = `/uploads/${encodeURIComponent(img.filename)}`;
        return { ...img, src };
      });
    }

    const allTags = await Tag.find().sort({ title: 1 }).lean();

    return res.render("album-edit", {
      album,
      user: req.user,
      availableImages,
      allTags,
      currentPath: req.path
    });
  } catch (err) {
    console.error("editAlbumPage error:", err);
    return res.status(500).redirect(`/album/${req.params.id}`);
  }
};

// ฟังก์ชันแก้ไขโปรไฟล์ (PUT /api/users/profile)
export const editImagePage = async (req, res) => {
  try {
    const Image = (await import("../models/imageModel.js")).default;
    const id = req.params.id;
    const image = await Image.findById(id).populate({ path: "user", select: "username name" }).lean();
    if (!image) return res.status(404).render("404");

    const currentUserId = req.user ? String(req.user._id) : "";
    const imageOwnerId = image.user ? String(image.user._id || image.user) : "";
    // ให้เฉพาะเจ้าของรูปเข้าถึงหน้าแก้ไขได้
    if (!currentUserId || currentUserId !== imageOwnerId) {
      return res.status(403).redirect(`/image/${id}`);
    }

    return res.render("image-edit", { image, user: req.user, currentPath: req.path });
  } catch (err) {
    console.error("editImagePage error:", err);
    return res.status(500).redirect(`/image/${req.params.id}`);
  }
};

// ฟังก์ชันแสดงหน้ารายการแท็ก
export const showTags = async (req, res) => {
  try {
    const Tag = (await import("../models/tagModel.js")).default;
    const Album = (await import("../models/albumModel.js")).default;

    const tags = await Tag.find().sort({ title: 1 }).lean();

    // aggregate counts of albums per tag
    const counts = await Album.aggregate([
      { $match: { tags: { $exists: true, $ne: [] } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } }
    ]);

    const countMap = counts.reduce((m, c) => { m[String(c._id)] = c.count; return m; }, {});
    tags.forEach(t => { t.count = countMap[String(t._id)] || 0; });

    return res.render("tags", { user: req.user, tags, currentPath: req.path });
  } catch (err) {
    console.error("showTags error:", err);
    return res.status(500).redirect("/home");
  }
};

// แก้เฉพาะ showTagAlbums ให้คำนวณ cover ล่วงหน้า (รองรับ fileId / imageUrl / filename)
export const showTagAlbums = async (req, res) => {
  try {
    const Tag = (await import("../models/tagModel.js")).default;
    const Album = (await import("../models/albumModel.js")).default;
    const id = req.params.id;

    const tag = await Tag.findById(id).lean();
    if (!tag) return res.status(404).render("404");

    const albumsRaw = await Album.find({ tags: id, status: "public" })
      .populate({ path: "images", select: "fileId filename imageUrl" })
      .populate({ path: "user", select: "username name" })
      .sort({ createdAt: -1 })
      .lean();

    const albums = albumsRaw.map(a => {
      let cover = "/images/default-cover.jpg";
      if (a.images && a.images[0]) {
        const i0 = a.images[0];
        if (i0.fileId) cover = `/files/${i0.fileId}`;
        else if (i0.imageUrl) cover = i0.imageUrl;
        else if (i0.filename) cover = `/uploads/${encodeURIComponent(i0.filename)}`;
      } else if (a.cover) {
        cover = a.cover.startsWith("/") ? a.cover : `/uploads/${encodeURIComponent(a.cover)}`;
      }
      const owner = (a.user && (a.user.name || a.user.username)) || "Unknown";
      return { ...a, cover, owner };
    });

    return res.render("tag-album", { albums, tag, user: req.user || null });
  } catch (err) {
    console.error("showTagAlbums error:", err);
    return res.status(500).render("tag-album", { albums: [], tag: null, user: req.user || null });
  }
};
