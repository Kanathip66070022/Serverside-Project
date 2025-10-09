export const createAlbum = async (req, res) => {
  try {
    const Album = (await import("../models/albumModel.js")).default;
    const Tag = (await import("../models/tagModel.js")).default;

    // helper to normalize single/array values
    const toArray = v => {
      if (!v) return [];
      return Array.isArray(v) ? v : [v];
    };

    const images = toArray(req.body.images || req.body['images[]']);
    const rawTags = toArray(req.body.tags || req.body['tags[]']);
    const title = (req.body.title || "").trim();
    const content = req.body.content || "";
    const status = req.body.status || "public";

    if (!title) return res.status(400).send("Title is required");

    // validate tags exist and keep only valid ids
    let validTagIds = [];
    if (rawTags.length) {
      const found = await Tag.find({ _id: { $in: rawTags } }).select("_id").lean();
      validTagIds = found.map(t => String(t._id));
    }

    const album = new Album({
      title,
      content,
      user: req.user ? req.user._id : null,
      images,
      tags: validTagIds,
      status
    });

    await album.save();

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(201).json({ ok: true, album });
    }
    return res.redirect(`/album/${album._id}`);
  } catch (err) {
    console.error("createAlbum error:", err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Create album failed" });
    }
    return res.status(500).redirect("/createAlbum");
  }
};

export const searchAlbums = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.redirect("/home");

    const Album = (await import("../models/albumModel.js")).default;
    let albums = await Album.find({
      title: { $regex: q, $options: "i" },
      status: "public"
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({ path: "user", select: "username name" }) // <-- populate owner
      .populate({ path: "images", select: "imageUrl originalname filename" })
      .lean();

    // ใส่ cover fallback และ owner ให้ view ใช้ง่ายขึ้น
    albums = albums.map(a => {
      const first = Array.isArray(a.images) && a.images.length ? a.images[0] : null;
      const cover = first ? (first.imageUrl || `/uploads/${first.filename}`) : "/images/default-cover.jpg";
      const owner = (a.user && (a.user.name || a.user.username)) || a.owner || "Unknown";
      return { ...a, cover, owner };
    });

    return res.render("home", {
      user: req.user || null,
      posts: [],
      albums,
      error: null,
      searchQuery: q
    });
  } catch (err) {
    console.error("searchAlbums error:", err);
    return res.render("home", {
      user: req.user || null,
      posts: [],
      albums: [],
      error: "Search failed, try again",
      searchQuery: req.query.q || ""
    });
  }
};

export const deleteAlbum = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const Album = (await import("../models/albumModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;

    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing album id" });

    const album = await Album.findById(id).exec();
    if (!album) return res.status(404).json({ error: "Album not found" });

    // เจ้าของเท่านั้น
    if (String(album.user) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const imageIds = Array.isArray(album.images) ? album.images.map(i => String(i)) : [];

    // ดึงข้อมูลรูปเพื่อเอาไฟล์ออกจากดิสก์
    const images = imageIds.length ? await Image.find({ _id: { $in: imageIds } }).lean() : [];

    await Promise.all(images.map(async img => {
      if (img && img.filename) {
        const p = path.join(process.cwd(), "uploads", img.filename);
        await fs.promises.unlink(p).catch(() => null);
      }
    }));

    // ลบ reference รูปจากอัลบั้มอื่น ๆ (ถ้ามี)
    if (imageIds.length) {
      await Album.updateMany(
        { images: { $in: imageIds } },
        { $pull: { images: { $in: imageIds } } }
      ).exec();
    }

    // ลบ documents รูปและอัลบั้ม
    if (imageIds.length) await Image.deleteMany({ _id: { $in: imageIds } }).exec();
    await Album.findByIdAndDelete(id).exec();

    // ตอบกลับ (JSON ถ้าเรียก API) หรือ redirect
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(200).json({ ok: true });
    }
    return res.redirect("/home");
  } catch (err) {
    console.error("deleteAlbum error:", err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Delete failed" });
    }
    return res.status(500).redirect("/home");
  }
};

export const addImageToAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    const Album = (await import("../models/albumModel.js")).default;
    const Image = (await import("../models/imageModel.js")).default;

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).send("Album not found");

    // สิทธิ์: เจ้าของอัลบั้มเท่านั้นที่เพิ่มรูปลงอัลบั้ม
    if (!req.user || String(album.user) !== String(req.user._id)) {
      return res.status(403).send("Forbidden");
    }

    // ถ้ามี imageId ให้เพิ่ม reference จาก DB (ไม่อัพโหลดไฟล์)
    const chosenId = req.body.imageId || req.body.image;
    if (chosenId) {
      const existing = await Image.findById(chosenId).lean();
      if (!existing) return res.status(404).send("Image not found");
      if (String(existing.user) !== String(req.user._id)) return res.status(403).send("Forbidden");

      album.images = album.images || [];
      if (!album.images.map(String).includes(String(existing._id))) {
        album.images.push(existing._id);
        await album.save();
      }

      if (req.headers.accept && req.headers.accept.includes("application/json")) {
        return res.status(201).json({ ok: true, image: existing });
      }
      return res.redirect(`/album/${albumId}`);
    }

    // ถ้าเป็น endpoint สำหรับ upload (มี multer) ให้ใช้ req.file flow (fallback)
    if (!req.file) return res.status(400).send("No file uploaded");
    const imgDoc = new Image({
      user: req.user._id,
      title: req.body.title || req.file.originalname || "Untitled",
      content: req.body.content || "",
      filename: req.file.filename,
      originalname: req.file.originalname,
      imageUrl: `/uploads/${req.file.filename}`,
      status: req.body.status || "public"
    });
    await imgDoc.save();
    album.images = album.images || [];
    album.images.push(imgDoc._id);
    await album.save();

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(201).json({ ok: true, image: imgDoc });
    }
    return res.redirect(`/album/${albumId}`);
  } catch (err) {
    console.error("addImageToAlbum error:", err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Upload failed" });
    }
    return res.status(500).redirect(`/album/${req.params.id}`);
  }
};

export const removeImageFromAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    const imageId = req.params.imageId;
    const Album = (await import("../models/albumModel.js")).default;

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ error: "Album not found" });

    // สิทธิ์: เจ้าของอัลบั้มเท่านั้นลบออกจากอัลบั้ม (ไม่ลบไฟล์/เอกสาร)
    if (!req.user || String(album.user) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await Album.findByIdAndUpdate(albumId, { $pull: { images: imageId } }).exec();

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json({ ok: true });
    }
    return res.redirect(`/album/${albumId}`);
  } catch (err) {
    console.error("removeImageFromAlbum error:", err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Remove failed" });
    }
    return res.status(500).redirect(`/album/${req.params.id}`);
  }
};

export const updateAlbum = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const Album = (await import("../models/albumModel.js")).default;
    const id = req.params.id;
    const album = await Album.findById(id);
    if (!album) return res.status(404).redirect("/home");
    if (String(album.user) !== String(req.user._1d ?? req.user._id)) return res.status(403).redirect(`/album/${id}`);

    album.title = req.body.title ?? album.title;
    album.content = req.body.content ?? album.content;
    if (typeof req.body.status !== 'undefined') album.status = req.body.status;

    await album.save();

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json({ ok: true, album });
    }
    return res.redirect(`/album/${id}`);
  } catch (err) {
    console.error("updateAlbum error:", err);
    return res.status(500).redirect(`/album/${req.params.id}`);
  }
};

export const addTagsToAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    const tagIds = Array.isArray(req.body.tagIds) ? req.body.tagIds : (req.body.tagIds ? [req.body.tagIds] : []);
    if (!tagIds.length) return res.status(400).json({ error: "No tags provided" });

    const Album = (await import("../models/albumModel.js")).default;
    const Tag = (await import("../models/tagModel.js")).default;

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ error: "Album not found" });

    // only album owner can add tags
    if (!req.user || String(album.user) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // validate tags exist
    const tags = await Tag.find({ _id: { $in: tagIds } }).lean();
    const validIds = tags.map(t => String(t._id));

    album.tags = album.tags || [];
    const existing = new Set(album.tags.map(String));
    const added = [];
    validIds.forEach(id => {
      if (!existing.has(id)) {
        album.tags.push(id);
        added.push(id);
      }
    });

    if (added.length) await album.save();

    // return added tags (full docs)
    const addedTags = tags.filter(t => added.includes(String(t._id)));

    return res.status(201).json({ ok: true, addedTags });
  } catch (err) {
    console.error("addTagsToAlbum error:", err);
    return res.status(500).json({ error: "Add tags failed" });
  }
};

export const removeTagFromAlbum = async (req, res) => {
  try {
    const albumId = req.params.id;
    const tagId = req.params.tagId;
    const Album = (await import("../models/albumModel.js")).default;

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ error: "Album not found" });

    // only album owner can remove tags
    if (!req.user || String(album.user) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await Album.findByIdAndUpdate(albumId, { $pull: { tags: tagId } }).exec();

    return res.json({ ok: true });
  } catch (err) {
    console.error("removeTagFromAlbum error:", err);
    return res.status(500).json({ error: "Remove tag failed" });
  }
};
