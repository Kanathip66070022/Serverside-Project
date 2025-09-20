/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         postId:
 *           type: integer
 *           description: Auto-incremented ID of the post
 *         username:
 *           type: string
 *           description: Reference ID of the user who created the post
 *         title:
 *           type: string
 *           description: Title of the post
 *         content:
 *           type: string
 *           description: Content of the post
 *         likes:
 *           type: integer
 *           description: Number of likes
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         status:
 *           type: string
 *           enum: [public, private]
 *           description: Visibility status of the post
 *           default: public
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags associated with the post
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [public, private]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *
 * /api/posts/{postId}:
 *   get:
 *     summary: Get a post by postId
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the post
 *     responses:
 *       200:
 *         description: Post data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *   put:
 *     summary: Update a post by postId
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [public, private]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *   delete:
 *     summary: Delete a post by postId
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the post
 *     responses:
 *       200:
 *         description: Post deleted successfully
 */

import express from "express";
import {
  createPost,
  getPosts,
  getPostByPostId,
  updatePostByPostId,
  deletePostByPostId
} from "../controllers/postController.js";

const router = express.Router();

// Routes
router.post("/", createPost);
router.get("/", getPosts);
router.get("/:postId", getPostByPostId);
router.put("/:postId", updatePostByPostId);
router.delete("/:postId", deletePostByPostId);

export default router;