// Middleware ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือไม่
export const ensureLoggedIn = (req, res, next) => {
    if (!req.user) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
    next();
};
