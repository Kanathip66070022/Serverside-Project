import Post from "../models/postModel.js";
import Image from "../models/imageModel.js";

// ✅ Create Post
export const createPost = async (req, res) => {
  try {
    const { username, title, content, status, tags } = req.body;

    const post = await Post.create({
      username,
      title,
      content,
      status,
      tags
    });

    res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

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

export const home = async (req, res) => {
  try {
    // โหลดรายการอัลบั้ม (public) เพื่อแสดงในหน้า home
    let albums = [];
    try {
      const Album = (await import("../models/albumModel.js")).default;
      albums = await Album.find({ status: "public" })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate({
          path: "images",
          select: "imageUrl originalname filename"
        })
        .lean();
    } catch (err) {
      console.warn("Album model not available or query failed:", err.message);
      albums = [];
    }

    // console.log("home albums sample:", albums.length ? albums[0] : "no albums");

    // ส่ง albums ให้ view เสมอ
    return res.render("home", {
      user: req.user || null,
      posts: [], 
      albums,
      error: null
    });
  } catch (err) {
    console.error("home error:", err);
    return res.render("home", {
      user: req.user || null,
      posts: [],
      albums: [],
      error: "Failed to load data"
    });
  }
};

// ✅ Get All Posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("username", "email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Post by postId
export const getPostByPostId = async (req, res) => {
  try {
    const post = await Post.findOne({ postId: req.params.postId }).populate("username", "email");
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Post
export const updatePostByPostId = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { postId: req.params.postId },
      req.body,
      { new: true }
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post updated", post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Post
export const deletePostByPostId = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ postId: req.params.postId });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const showUpload = async (req, res) => {
  res.render("upload");
};

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