export const createAlbum = async (req, res) => {
  try {
    if (!req.user) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);

    const { title, content } = req.body;

    // อ่านค่า images จาก form หลายรูป (รองรับกรณี string หรือ array หรือ stringified array)
    let selected = req.body.images || req.body["images[]"] || [];
    if (typeof selected === "string") {
      if (selected.trim().startsWith("[")) {
        // try parse simple stringified array like "['id','id']" or '["id","id"]'
        selected = selected.replace(/^\[|\]$/g, "").split(",").map(s => s.replace(/['"\s]/g, "")).filter(Boolean);
      } else {
        selected = [selected];
      }
    }
    const imageIds = Array.isArray(selected) ? selected.map(s => String(s).trim()).filter(Boolean) : [];

    // โหลดรูปของ user เพื่อแสดงเมื่อมี error
    const Image = (await import("../models/imageModel.js")).default;
    const userImages = await Image.find({ user: req.user._id }).sort({ createdAt: -1 }).select("filename originalname title _id");

    if (!title?.trim() || imageIds.length === 0) {
      return res.status(400).render("createAlbum", {
        images: userImages,
        error: "กรุณากรอกชื่ออัลบั้มและเลือกรูปอย่างน้อย 1 รูป",
        success: null
      });
    }

    // ตรวจว่า id ที่ส่งมาเป็นรูปของผู้ใช้จริง
    const imagesFound = await Image.find({ _id: { $in: imageIds }, user: req.user._id }).select("_id");
    if (imagesFound.length !== imageIds.length) {
      return res.status(400).render("createAlbum", {
        images: userImages,
        error: "บางรูปที่เลือกไม่พบหรือไม่ได้เป็นของคุณ",
        success: null
      });
    }

    const Album = (await import("../models/albumModel.js")).default;
    await Album.create({
      title: title.trim(),
      content: content || "",
      images: imagesFound.map(i => i._id), // เก็บ ObjectId
      user: req.user._id,
      status: req.body.status || "public"
    });

    return res.redirect("/album/create?success=1");
  } catch (err) {
    console.error("createAlbum error:", err);
    // ในกรณี error ให้ส่ง images กลับเพื่อไม่ให้ view พัง
    const Image = (await import("../models/imageModel.js")).default;
    const userImages = await Image.find({ user: req.user?._id }).select("filename originalname title _id");
    return res.status(500).render("createAlbum", { images: userImages || [], error: "เกิดข้อผิดพลาด กรุณาลองใหม่", success: null });
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
