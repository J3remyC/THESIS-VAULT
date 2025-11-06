import express from "express";
import {
  login,
  logout,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
} from "../controllers/auth.controller.js";



import { verifyToken } from "../middleware/verifyToken.js";
import { checkRole } from "../middleware/checkRole.js";

const router = express.Router();
  
    


// ✅ Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ✅ Protected route (requires token)
router.get("/check-auth", verifyToken, checkAuth);

// ✅ Admin-only route
router.get(
  "/admin-dashboard",
  verifyToken,
  checkRole(["admin"]),
  (req, res) => {
    res.json({ message: "Welcome Admin!" });
  }
);

// ✅ Superadmin-only route (optional)
router.get(
  "/superadmin-dashboard",
  verifyToken,
  checkRole(["superadmin"]),
  (req, res) => {
    res.json({ message: "Welcome Superadmin!" });
  }
);

export default router;
