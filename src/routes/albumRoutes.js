import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import upload from "../config/multerUploads.js";
import { createAlbum, searchAlbums, deleteAlbum, updateAlbum, addImageToAlbum, removeImageFromAlbum, addTagsToAlbum, removeTagFromAlbum } from "../controllers/postController.js";

const router = express.Router();

/**
 * @openapi
 * /api/albums/search:
 *   get:
 *     tags: [Albums]
 *     summary: ค้นหาอัลบั้ม
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: คำค้นหา (ชื่อ/เนื้อหา)
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, default: 10 }
 *     responses:
 *       200:
 *         description: รายการอัลบั้มที่ค้นได้
 */
// Search albums
router.get("/search", authMiddleware, searchAlbums);

/**
 * @openapi
 * /api/albums/createAlbum:
 *   post:
 *     tags: [Albums]
 *     summary: สร้างอัลบั้มใหม่
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               status: { type: string, enum: [public, private], default: public }
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: สร้างอัลบั้มสำเร็จ
 */
// Create album
router.post("/createAlbum", authMiddleware, ensureLoggedIn, createAlbum);

/**
 * @openapi
 * /api/albums/{id}/images:
 *   post:
 *     tags: [Albums]
 *     summary: เพิ่มรูป (อ้างอิงรูปที่มีอยู่) เข้าอัลบั้ม
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageId]
 *             properties:
 *               imageId: { type: string }
 *     responses:
 *       200:
 *         description: เพิ่มรูปสำเร็จ
 */
// เพิ่มรูปที่มีอยู่เข้าอัลบั้ม
router.post("/:id/images", authMiddleware, ensureLoggedIn, addImageToAlbum);

/**
 * @openapi
 * /api/albums/{id}/images/upload:
 *   post:
 *     tags: [Albums]
 *     summary: อัปโหลดรูปใหม่แล้วเพิ่มเข้าอัลบั้ม
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image: { type: string, format: binary, description: ชื่อฟิลด์ = image }
 *               title: { type: string }
 *               content: { type: string }
 *               tags:
 *                 oneOf:
 *                   - type: array
 *                     items: { type: string }
 *                   - type: string
 *     responses:
 *       201:
 *         description: อัปโหลดและเพิ่มสำเร็จ
 */
// อัปโหลดรูปใหม่แล้วเพิ่มเข้าอัลบั้ม
router.post("/:id/images/upload", authMiddleware, ensureLoggedIn, upload.single("image"), addImageToAlbum);

/**
 * @openapi
 * /api/albums/{id}/images/{imageId}:
 *   delete:
 *     tags: [Albums]
 *     summary: ลบรูปออกจากอัลบั้ม (และลบไฟล์/เอกสารรูป)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 */
// ลบรูปออกจากอัลบั้ม (และลบไฟล์/เอกสารรูป)
router.delete("/:id/images/:imageId", authMiddleware, ensureLoggedIn, removeImageFromAlbum);

/**
 * @openapi
 * /api/albums/{id}:
 *   delete:
 *     tags: [Albums]
 *     summary: ลบอัลบั้ม
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ลบอัลบั้มสำเร็จ
 */
// Delete album
router.delete("/:id", authMiddleware, ensureLoggedIn, deleteAlbum);

/**
 * @openapi
 * /api/albums/{id}:
 *   put:
 *     tags: [Albums]
 *     summary: แก้ไขข้อมูลอัลบั้ม
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               status: { type: string, enum: [public, private] }
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 */
// Update album
router.put("/:id", authMiddleware, ensureLoggedIn, updateAlbum);

/**
 * @openapi
 * /api/albums/{id}/tags:
 *   post:
 *     tags: [Albums]
 *     summary: เพิ่มแท็กให้อัลบั้ม
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tags]
 *             properties:
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: เพิ่มแท็กสำเร็จ
 */
// เพิ่มแท็กให้อัลบั้ม
router.post("/:id/tags", authMiddleware, ensureLoggedIn, addTagsToAlbum);

/**
 * @openapi
 * /api/albums/{id}/tags/{tagId}:
 *   delete:
 *     tags: [Albums]
 *     summary: เอาแท็กออกจากอัลบั้ม
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: เอาแท็กออกสำเร็จ
 */
// เอาแท็กออกจากอัลบั้ม
router.delete("/:id/tags/:tagId", authMiddleware, ensureLoggedIn, removeTagFromAlbum);

export default router;
