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

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 4);

    const query = { status: "public" };

    const total = await Album.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    const albums = await Album.find(query)
      .populate({ path: "images", select: "filename imageUrl" })
      .populate({ path: "user", select: "username name" })
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit)
      .lean();

    const normalized = albums.map(a => {
      const cover = (a.images && a.images[0])
        ? (a.images[0].imageUrl || `/uploads/${a.images[0].filename}`)
        : "/images/default-cover.jpg";
      const owner = (a.user && (a.user.name || a.user.username)) || 'Unknown';
      return { ...a, cover, owner };
    });

    // --- My Albums pagination ---
    let myAlbums = [];
    let myCurrentPage = 1;
    let myTotalPages = 1;
    if (req.user) {
      myCurrentPage = Math.max(1, parseInt(req.query.myPage) || 1);
      const myLimit = 6; // items per page for "My Albums"
      const myTotal = await Album.countDocuments({ user: req.user._id });
      myTotalPages = Math.max(1, Math.ceil(myTotal / myLimit));
      const mySafePage = Math.min(myCurrentPage, myTotalPages);

      myAlbums = await Album.find({ user: req.user._id })
        .populate({ path: "images", select: "filename imageUrl" })
        .sort({ createdAt: -1 })
        .skip((mySafePage - 1) * myLimit)
        .limit(myLimit)
        .lean();

      myAlbums = myAlbums.map(a => {
        const cover = (a.images && a.images[0])
          ? (a.images[0].imageUrl || `/uploads/${a.images[0].filename}`)
          : "/images/default-cover.jpg";
        return { ...a, cover };
      });

      myCurrentPage = mySafePage;
    }

    return res.render("home", {
      albums: normalized,
      currentPage: safePage,
      totalPages,
      user: req.user,
      myAlbums,
      myCurrentPage,
      myTotalPages
    });
  } catch (err) {
    console.error("home error:", err);
    return res.status(500).render("home", { albums: [], currentPage: 1, totalPages: 1, user: req.user, myAlbums: [], myCurrentPage: 1, myTotalPages: 1 });
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
        const Image = (await import("../models/imageModel.js")).default;

        const album = await Album.findById(req.params.id)
            .populate({ path: "user", select: "username name" })
            .populate({ path: "images", select: "filename imageUrl title content" })
            .populate({ path: "tags", select: "title" }) // <-- populate tags
            .lean();

        if (!album) return res.status(404).render("404");

        const cover = (album.images && album.images[0])
            ? (album.images[0].imageUrl || `/uploads/${album.images[0].filename}`)
            : "/images/default-cover.jpg";

        album.user = album.user || {};
        album.user.name = album.user.name || album.user.username || "Unknown";

        // normalize tags: support populated docs or plain string ids
        album.tags = (album.tags || []).map(t => {
            if (!t) return null;
            if (typeof t === "string") return { _id: t, title: t };
            if (t.title) return t;
            if (t._id) return { _id: t._id, title: String(t._id) };
            return null;
        }).filter(Boolean);

        return res.render("album", { album: { ...album, cover } });
    } catch (err) {
        console.error("showAlbum error:", err);
        return res.status(500).render("album", { album: null });
    }
};

export const editAlbumPage = async (req, res) => {
  try {
    const Album = (await import("../models/albumModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;
    const Tag = (await import("../models/tagModel.js")).default;
    const id = req.params.id;

    const album = await Album.findById(id)
      .populate({ path: "images", select: "filename imageUrl title user originalname" })
      .populate({ path: "user", select: "username name" })
      .populate({ path: "tags", select: "title" }) // ensure tag titles available
      .lean();

    if (!album) return res.status(404).render("404");

    const currentUserId = req.user ? String(req.user._id) : null;

    // available images (user's images not already in this album)
    const excludeIds = Array.isArray(album.images) ? album.images.map(i => String(i._id || i)) : [];
    const availableImages = currentUserId
      ? await Image.find({ user: currentUserId, _id: { $nin: excludeIds } })
          .select("title filename originalname imageUrl")
          .lean()
      : [];

    // all tags for the select box
    const allTags = await Tag.find().sort({ title: 1 }).lean();

    return res.render("album-edit", { album, user: req.user, availableImages, allTags, currentPath: req.path });
  } catch (err) {
    console.error("editAlbumPage error:", err);
    return res.status(500).redirect(`/album/${req.params.id}`);
  }
};

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

export const showTagAlbums = async (req, res) => {
  try {
    const Tag = (await import("../models/tagModel.js")).default;
    const Album = (await import("../models/albumModel.js")).default;
    const id = req.params.id;

    const tag = await Tag.findById(id).lean();
    if (!tag) return res.status(404).render("404");

    // find albums that reference this tag (only public or you can change logic)
    const albums = await Album.find({ tags: id })
      .populate({ path: "images", select: "filename imageUrl" })
      .populate({ path: "user", select: "username name" })
      .sort({ createdAt: -1 })
      .lean();

    // prepare cover and owner display
    const normalized = albums.map(a => {
      const cover = (a.images && a.images[0])
        ? (a.images[0].imageUrl || `/uploads/${a.images[0].filename}`)
        : "/images/default-cover.jpg";
      const owner = (a.user && (a.user.name || a.user.username)) || a.owner || "Unknown";
      return { ...a, cover, owner };
    });

    return res.render("tag-album", { albums: normalized, tag, user: req.user, currentPath: req.path });
  } catch (err) {
    console.error("showTagAlbums error:", err);
    return res.status(500).redirect("/home");
  }
};
