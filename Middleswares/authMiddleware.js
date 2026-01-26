import jwt from "jsonwebtoken";
import User from "../Models/userSchema.js";
import dotenv from "dotenv"


dotenv.config()

export const authMiddleware = async (req, res, next) => {  
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return res.status(401).json({ message: "Token not found" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded._id).select("-password");

        if (!req.user) {
            return res.status(401).json({ message: "Invalid token user" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
