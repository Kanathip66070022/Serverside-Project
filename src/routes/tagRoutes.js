import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";
import { listTags, getTagCount, createTag, deleteTag } from "../controllers/tagController.js";

const router = express.Router();

/**
 * @openapi
 * /api/tags:
 *   get:
 *     tags: [Tags]
 *     summary: List all tags
 *     responses:
 *       200:
 *         description: Array of tags
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   title: { type: string }
 */
router.get("/", listTags);

/**
 * @openapi
 * /api/tags/count:
 *   get:
 *     tags: [Tags]
 *     summary: Get total tag count
 *     responses:
 *       200:
 *         description: Total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 */
router.get("/count", getTagCount);

/**
 * @openapi
 * /api/tags:
 *   post:
 *     tags: [Tags]
 *     summary: Create a new tag
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
 *     responses:
 *       201:
 *         description: Created tag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 title: { type: string }
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, ensureLoggedIn, createTag);

/**
 * @openapi
 * /api/tags/{id}:
 *   delete:
 *     tags: [Tags]
 *     summary: Delete a tag by id
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
 *         description: Delete result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted: { type: boolean }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
router.delete("/:id", authMiddleware, ensureLoggedIn, deleteTag);

export default router;
