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

// ฟังก์ชันแสดงหน้าอัพโหลด
export const showUpload = (req, res) => {
    res.render("upload", { error: null, success: null });
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
