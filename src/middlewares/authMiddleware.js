import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Middleware ตรวจสอบ JWT จาก Header หรือ Cookie
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies?.token;

    if (!token) {
      req.user = null;
      return next();
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findById(payload.id).select("-password");
    if (!user) {
      req.user = null;
      return next();
    }

    req.user = user;
    res.locals.user = user; // ให้ views เข้าถึง user ได้โดยตรง
    next();
  } catch (err) {
    console.error("authMiddleware:", err.message);
    req.user = null;
    return next();
  }
};

export default authMiddleware;
