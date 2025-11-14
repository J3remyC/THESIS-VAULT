import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;
    if(!token) return res.status(401).json({success: false, message: "Unauthorized - No token provided"})
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if(!decoded) return res.status(401).json({success: false, message: "Unauthorized - Invalid token"})
        const user = await User.findById(decoded.userId).select("-password");
        if(!user) return res.status(404).json({success: false, message: "User not found"})
        if(user.isBanned) return res.status(403).json({success: false, message: "Account is banned"})
        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch (error) {
        console.log("Error in verify token", error);
        return res.status(500).json({success: false, message: "Server error"})
    }
};

// Variant that allows banned users through (for check-auth) so the client can show a banned overlay
export const verifyTokenAllowBanned = async (req, res, next) => {
    const token = req.cookies.token;
    if(!token) return res.status(401).json({success: false, message: "Unauthorized - No token provided"})
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if(!decoded) return res.status(401).json({success: false, message: "Unauthorized - Invalid token"})
        const user = await User.findById(decoded.userId).select("-password");
        if(!user) return res.status(404).json({success: false, message: "User not found"})
        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch (error) {
        console.log("Error in verify token", error);
        return res.status(500).json({success: false, message: "Server error"})
    }
};