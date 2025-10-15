import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import { ensureLoggedIn } from "../middlewares/ensureMiddleware.js";

import { showProfile, showImage } from "../controllers/pageController.js";
import {
    showLogin, showRegister, showUpload, showCreateAlbum,
    showAlbum, home, editAlbumPage, editImagePage, showTags, showTagAlbums
} from "../controllers/pageController.js";

const router = express.Router();

/**
 * @openapi
 * /:
 *   get:
 *     tags: [Pages]
 *     summary: Redirect to /home
 *     responses:
 *       302:
 *         description: Redirect to /home
 */
// Redirect root to /home
router.get('/', (req, res) => res.redirect('/home'));

/**
 * @openapi
 * /home:
 *   get:
 *     tags: [Pages]
 *     summary: Home page (albums listing)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, oldest, title, owner]
 *           default: latest
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 */
// Home page
router.get("/home", home);

/**
 * @openapi
 * /login:
 *   get:
 *     tags: [Pages]
 *     summary: Login page
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 */
// Login page
router.get("/login", showLogin);

/**
 * @openapi
 * /register:
 *   get:
 *     tags: [Pages]
 *     summary: Register page
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 */
// Register page
router.get("/register", showRegister);

/**
 * @openapi
 * /tags:
 *   get:
 *     tags: [Pages]
 *     summary: Tags page (list tags)
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 */
// Tags page
router.get("/tags", showTags);

/**
 * @openapi
 * /tags/{id}:
 *   get:
 *     tags: [Pages]
 *     summary: Albums by tag
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 *       404:
 *         description: Not found
 */
// Albums by tag
router.get("/tags/:id", showTagAlbums);

/**
 * @openapi
 * /profile:
 *   get:
 *     tags: [Pages]
 *     summary: Profile page
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 *       401:
 *         description: Unauthorized
 */
// Profile page
router.get("/profile", authMiddleware, ensureLoggedIn, showProfile);

/**
 * @openapi
 * /upload:
 *   get:
 *     tags: [Pages]
 *     summary: Upload page
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 *       401:
 *         description: Unauthorized
 */
// Upload page
router.get("/upload", authMiddleware, ensureLoggedIn, showUpload);

/**
 * @openapi
 * /image/{id}:
 *   get:
 *     tags: [Pages]
 *     summary: Image detail page
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
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
// Image detail page
router.get("/image/:id", authMiddleware, ensureLoggedIn, showImage);

/**
 * @openapi
 * /image/{id}/edit:
 *   get:
 *     tags: [Pages]
 *     summary: Edit image page
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
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
// Edit image page
router.get("/image/:id/edit", authMiddleware, ensureLoggedIn, editImagePage);

/**
 * @openapi
 * /album/create:
 *   get:
 *     tags: [Pages]
 *     summary: Create album page
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 *       401:
 *         description: Unauthorized
 */
// Create album page
router.get("/album/create", authMiddleware, ensureLoggedIn, showCreateAlbum);

/**
 * @openapi
 * /album/{id}:
 *   get:
 *     tags: [Pages]
 *     summary: Album detail page
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
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
// Album detail page
router.get("/album/:id", authMiddleware, ensureLoggedIn, showAlbum);

/**
 * @openapi
 * /album/{id}/edit:
 *   get:
 *     tags: [Pages]
 *     summary: Edit album page
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
 *         description: HTML page
 *         content:
 *           text/html:
 *             schema: { type: string }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
// Edit album page
router.get("/album/:id/edit", authMiddleware, ensureLoggedIn, editAlbumPage);

export default router;
