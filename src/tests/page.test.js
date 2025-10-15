import { jest } from "@jest/globals"; // เพิ่มบรรทัดนี้
import { showLogin, showRegister } from "../controllers/pageController.js";

// ทดสอบฟังก์ชัน showLogin และ showRegister
describe("Auth Pages", () => {
    let res;

    beforeEach(() => {
        res = { render: jest.fn() };
    });

    it("showLogin should render login page", () => {
        showLogin({}, res);
        expect(res.render).toHaveBeenCalledWith("login");
    });

    it("showRegister should render register page", () => {
        showRegister({}, res);
        expect(res.render).toHaveBeenCalledWith("register");
    });
});
