import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { User } from "../models/user.model.js";
import { Department } from "../models/department.model.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// USER MANAGEMENT
router.get(
  "/users",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (_req, res) => {
    try {
      const users = await User.find().select("name email role createdAt isVerified");
      res.json(users);
    } catch (e) {
      res.status(500).json({ message: "Failed to list users" });
    }
  }
);

router.post(
  "/users",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const { name, email, password, role = "student" } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: "Email already registered" });
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const user = await User.create({ name, email, password: hashed, role, isVerified: true });
      res.status(201).json({ id: user._id });
    } catch (e) {
      res.status(500).json({ message: "Failed to add user" });
    }
  }
);

router.patch(
  "/users/:id/role",
  verifyToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const { role } = req.body;
      if (! ["guest", "student", "admin", "superadmin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
        .select("name email role");
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (e) {
      res.status(500).json({ message: "Failed to update role" });
    }
  }
);

// DEPARTMENTS CRUD
router.get(
  "/departments",
  verifyToken,
  authorizeRoles("superadmin"),
  async (_req, res) => {
    const list = await Department.find().sort({ name: 1 });
    res.json(list);
  }
);

router.post(
  "/departments",
  verifyToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    const { name, code } = req.body;
    const dep = await Department.create({ name, code });
    res.status(201).json(dep);
  }
);

router.patch(
  "/departments/:id",
  verifyToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    const dep = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dep) return res.status(404).json({ message: "Not found" });
    res.json(dep);
  }
);

router.delete(
  "/departments/:id",
  verifyToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  }
);

// SYSTEM backup/restore placeholders
router.post(
  "/system/backup",
  verifyToken,
  authorizeRoles("superadmin"),
  async (_req, res) => {
    // Placeholder: implement dump/export strategy later
    res.json({ message: "Backup started (placeholder)" });
  }
);

router.post(
  "/system/restore",
  verifyToken,
  authorizeRoles("superadmin"),
  async (_req, res) => {
    // Placeholder: implement restore/import strategy later
    res.json({ message: "Restore started (placeholder)" });
  }
);

export default router;
