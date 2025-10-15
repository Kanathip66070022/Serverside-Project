// src/tests/tag.test.js
import { jest } from "@jest/globals";
import { listTags, getTagCount } from "../controllers/tagController.js";

// ทดสอบ listTags controller
describe("listTags controller", () => {
    it("should return tags successfully", async () => {
        const req = {};
        const res = {
            json: jest.fn(),
        };

        // mock Tag.find().sort().lean()
        const mockTags = [{ title: "Tag1" }, { title: "Tag2" }];
        const Tag = await import("../models/tagModel.js").then(m => m.default);
        jest.spyOn(Tag, "find").mockReturnValue({
            sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockTags)
            })
        });

        await listTags(req, res);

        expect(res.json).toHaveBeenCalledWith({ ok: true, tags: mockTags });
    });
});

// ทดสอบ getTagCount controller
describe("getTagCount controller", () => {
    it("should return tag count in json", async () => {
        const req = {};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        // mock Tag.countTags()
        const Tag = await import("../models/tagModel.js").then(m => m.default);
        jest.spyOn(Tag, "countTags").mockResolvedValue(7);

        await getTagCount(req, res);

        expect(res.json).toHaveBeenCalledWith({ ok: true, count: 7 });
    });
});
