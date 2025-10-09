import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";
import { listTags, getTagCount, createTag, deleteTag } from "../controllers/tagController.js";

const router = express.Router();

// GET /api/tags
router.get("/", listTags);

// GET /api/tags/count
router.get("/count", getTagCount);

// POST /api/tags (create) - protected
router.post("/", authMiddleware, ensureLoggedIn, createTag);

// DELETE /api/tags/:id - protected
router.delete("/:id", authMiddleware, ensureLoggedIn, deleteTag);

export default router;