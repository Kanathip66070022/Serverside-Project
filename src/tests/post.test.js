import { searchAlbums } from "../controllers/postController.js";
import { jest } from "@jest/globals"; // สำหรับ jest globals ใน ESM
import { createAlbum } from "../controllers/postController.js";

// ทดสอบ searchAlbums controller
describe("searchAlbums controller", () => {
    let req, res;

    beforeEach(() => {
        req = { query: {}, user: null };
        res = {
            redirect: jest.fn(),
            render: jest.fn()
        };
    });

    afterEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    it("should redirect to /home if query is empty", async () => {
        req.query.q = "";
        await searchAlbums(req, res);
        expect(res.redirect).toHaveBeenCalledWith("/home");
    });
});

// ทดสอบ createAlbum controller
describe("createAlbum controller", () => {
    it("should create album successfully and return JSON", async () => {
        const req = {
            body: {
                title: "My Album",
                content: "Test content",
                tags: ["tag1", "tag2"],
                images: ["img1.jpg"],
            },
            user: { _id: "user123" },
            headers: { accept: "application/json" },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            redirect: jest.fn(),
        };

        const Album = (await import("../models/albumModel.js")).default;
        const Tag = (await import("../models/tagModel.js")).default;

        // ✅ mock Tag.find ให้ chain select().lean() ได้
        jest.spyOn(Tag, "find").mockReturnValue({
            select: () => ({
                lean: () => Promise.resolve([{ _id: "tag1" }, { _id: "tag2" }]),
            }),
        });

        jest.spyOn(Album.prototype, "save").mockResolvedValue(true);

        await createAlbum(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                ok: true,
                album: expect.any(Object),
            })
        );
    });
});
