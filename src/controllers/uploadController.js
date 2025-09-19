import Image from "../models/imageModel.js";

// ฟังก์ชันอัพโหลดรูป
export const uploadImage = async (req, res) => {
    try {
        // multer จะเก็บไฟล์ไว้ใน req.file
        const { title, content } = req.body;
        const imageUrl = "/uploads/" + req.file.filename;

        const newImage = new Image({
            title,
            content,
            imageUrl
        });

        await newImage.save();
        res.redirect("/gallery"); // redirect ไปหน้า gallery หลังอัพโหลดเสร็จ
    } catch (err) {
        console.error(err);
        res.status(500).send("Upload failed");
    }
};

// ฟังก์ชันดึงรูปทั้งหมด
export const getImages = async (req, res) => {
    try {
        const images = await Image.find().sort({ createdAt: -1 });
        res.render("gallery", { images });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load gallery");
    }
};
