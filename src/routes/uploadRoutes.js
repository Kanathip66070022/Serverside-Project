import express from "express";

import upload from "../config/multerConfig.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import { uploadImage, getImages, deleteImage, editImage } from "../controllers/uploadController.js";

const router = express.Router();

/**
 * @openapi
 * /api/upload/gallery:
 *   get:
 *     tags: [Upload]
 *     summary: ดึงรายการรูปภาพ (gallery)
 *     responses:
 *       200:
 *         description: รายการรูปภาพ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   title: { type: string }
 *                   content: { type: string }
 *                   fileId: { type: string, nullable: true }
 *                   imageUrl: { type: string, nullable: true }
 *                   filename: { type: string, nullable: true }
 *                   user: { type: string }
 *                   createdAt: { type: string, format: date-time }
 *       500:
 *         description: Server error
 */

/**
 * @openapi
 * /api/upload:
 *   post:
 *     tags: [Upload]
 *     summary: อัปโหลดรูปภาพใหม่
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               albumId:
 *                 type: string
 *               tags:
 *                 oneOf:
 *                   - type: array
 *                     items: { type: string }
 *                   - type: string
 *             required: [image]
 *     responses:
 *       201:
 *         description: อัปโหลดสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 fileId: { type: string }
 *                 filename: { type: string }
 *                 imageUrl: { type: string, nullable: true }
 *                 title: { type: string }
 *                 content: { type: string }
 *                 user: { type: string }
 *                 createdAt: { type: string, format: date-time }
 *       400:
 *         description: คำขอไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้รับอนุญาต
 */

/**
 * @openapi
 * /api/upload/images/{id}:
 *   delete:
 *     tags: [Upload]
 *     summary: ลบรูปภาพตามไอดี
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
 *         description: ลบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted: { type: boolean }
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *       404:
 *         description: ไม่พบรายการ
 */

/**
 * @openapi
 * /api/upload/images/{id}:
 *   patch:
 *     tags: [Upload]
 *     summary: แก้ไขข้อมูล/ไฟล์รูปภาพ
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 oneOf:
 *                   - type: array
 *                     items: { type: string }
 *                   - type: string
 *     responses:
 *       200:
 *         description: อัปเดตรูปภาพสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 fileId: { type: string }
 *                 filename: { type: string }
 *                 imageUrl: { type: string, nullable: true }
 *                 title: { type: string }
 *                 content: { type: string }
 *                 updatedAt: { type: string, format: date-time }
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *       404:
 *         description: ไม่พบรายการ
 */

/**
 * @openapi
 * /api/upload/image/{id}:
 *   patch:
 *     deprecated: true
 *     tags: [Upload]
 *     summary: แก้ไขรูปภาพ (alias เดิม ควรใช้ /images/{id})
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 */

/**
 * @openapi
 * /api/upload/upload:
 *   post:
 *     deprecated: true
 *     tags: [Upload]
 *     summary: อัปโหลดรูปภาพ (alias เดิม ควรใช้ POST /api/upload)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               title: { type: string }
 *               content: { type: string }
 *             required: [image]
 *     responses:
 *       201:
 *         description: อัปโหลดสำเร็จ
 */

// Public gallery (no auth)
router.get("/gallery", getImages);

// DELETE image by id
router.post("/", authMiddleware, upload.single("image"), uploadImage);

// optional alias singular
router.delete("/images/:id", authMiddleware, ensureLoggedIn, deleteImage);

// PATCH update image metadata / replace file
router.patch("/images/:id", authMiddleware, ensureLoggedIn, upload.single("image"), editImage);

// optional alias singular
router.patch("/image/:id", authMiddleware, ensureLoggedIn, upload.single("image"), editImage);

// protected upload route with auth
router.post("/upload", authMiddleware, ensureLoggedIn, upload.single("image"), uploadImage);

export default router;
