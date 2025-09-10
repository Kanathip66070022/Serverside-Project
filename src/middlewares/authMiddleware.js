import jwt from "jsonwebtoken"
import userService from "../services/userService.js"

const authMiddleware = () => {
    return async (req, res, next) => {
        try {
            const jwt_secret = process.env.JWT_SECRET
            const authHeader = req.headers["authorization"]

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ message: "No token provided" })
            }

            const token = authHeader.split(" ")[1]
            const decodedToken = jwt.verify(token, jwt_secret)

            const user = await userService.getUserById(decodedToken.userId)
            if (!user) {
                return res.status(401).json({ message: "Invalid token" })
            }

            // เก็บทั้ง user object (ยืดหยุ่นกว่า)
            req.user = user
            next()
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized" })
        }
    }
}

export default authMiddleware
