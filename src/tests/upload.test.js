import { jest } from "@jest/globals";
import { uploadImage } from "../controllers/uploadController.js"; // ปรับ path ให้ตรงจริง

// ทดสอบ uploadImage controller
describe("uploadImage controller", () => {
    it("should return 400 if no file uploaded", async () => {
        const req = {
            file: null,
            body: {},
            user: null,
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            render: jest.fn(),
        };

        await uploadImage(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.render).toHaveBeenCalledWith(
            "upload",
            expect.objectContaining({
                error: "กรุณาเลือกไฟล์!",
                success: null,
                file: null,
            })
        );
    });
});
