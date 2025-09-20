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
    const albums = await Album.find({
      title: { $regex: q, $options: "i" },
      status: "public"
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({ path: "images", select: "imageUrl originalname filename" })
      .lean();

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
