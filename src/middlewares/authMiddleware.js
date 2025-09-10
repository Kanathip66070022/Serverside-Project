import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const authMiddleware = () => {
  return async (req, res, next) => {
    try {
      const jwt_secret = process.env.JWT_SECRET || "secret";
      const authHeader = req.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decodedToken = jwt.verify(token, jwt_secret);

      const user = await User.findById(decodedToken.id);
      if (!user) return res.status(401).json({ message: "Invalid token" });

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
};

export default authMiddleware;
