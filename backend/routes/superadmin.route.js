import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { User } from "../models/user.model.js";
import { Department } from "../models/department.model.js";
import { Application } from "../models/application.model.js";
import bcrypt from "bcryptjs";
import { ActivityLog } from "../models/activityLog.model.js";

const router = express.Router();

// Update user basic info (name, email, and optionally role)
router.patch(
  "/users/:id",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const { name, email, role } = req.body || {};
      const target = await User.findById(req.params.id);
      if (!target) return res.status(404).json({ message: "User not found" });
      // admins cannot modify admins/superadmins (any fields)
      if (req.user.role === "admin" && ["admin", "superadmin"].includes(target.role)) {
        return res.status(403).json({ message: "Admins cannot modify admin/superadmin accounts" });
      }

      const update = {};
      if (typeof name === "string") update.name = name;
      if (typeof email === "string") update.email = email;
      if (typeof role === "string") {
        if (!["guest", "student", "admin", "superadmin"].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        // cannot change role of superadmin (including self)
        if (target.role === "superadmin" && role !== target.role) {
          return res.status(403).json({ message: "Cannot change superadmin role" });
        }
        // admins cannot elevate to admin/superadmin or downgrade privileged accounts
        if (req.user.role === "admin" && ["admin", "superadmin"].includes(role)) {
          return res.status(403).json({ message: "Admins cannot assign admin/superadmin" });
        }
        if (req.user.role === "admin" && ["admin", "superadmin"].includes(target.role)) {
          return res.status(403).json({ message: "Admins cannot change admin/superadmin" });
        }
        update.role = role;
      }
      const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("name email role isVerified isBanned banReason bannedAt");

      // If editing student profile fields, update their approved application
      const { lastName, firstName, middleInitial, section, course, schoolYear } = req.body || {};
      if (user.role === 'student' && (
        lastName !== undefined || firstName !== undefined || middleInitial !== undefined || section !== undefined || course !== undefined || schoolYear !== undefined
      )) {
        const appUpdate = {};
        if (typeof lastName === 'string') appUpdate.lastName = lastName;
        if (typeof firstName === 'string') appUpdate.firstName = firstName;
        if (typeof middleInitial === 'string') appUpdate.middleInitial = middleInitial;
        if (typeof section === 'string') appUpdate.section = section;
        if (typeof course === 'string') appUpdate.course = course;
        if (typeof schoolYear === 'string') appUpdate.schoolYear = schoolYear;
        const prof = await Application.findOneAndUpdate({ user: user._id, status: 'approved' }, appUpdate, { new: true });
        await ActivityLog.create({
          actor: req.user._id,
          action: "STUDENT_PROFILE_UPDATE",
          details: { userId: user._id, changes: appUpdate, applicationId: prof?._id }
        });
      }
      await ActivityLog.create({
        actor: req.user._id,
        action: "USER_UPDATE",
        details: { userId: user._id, changes: update }
      });
      res.json(user);
    } catch (e) {
      res.status(500).json({ message: "Failed to update user" });
    }
  }
);

// Fetch a user's approved application profile (for editing student info)
router.get(
  "/users/:id/profile",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const app = await Application.findOne({ user: req.params.id, status: 'approved' });
      res.json(app || null);
    } catch (e) {
      res.status(500).json({ message: "Failed to load profile" });
    }
  }
);

// Ban a user
router.patch(
  "/users/:id/ban",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const target = await User.findById(req.params.id);
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.role === "superadmin") return res.status(403).json({ message: "Cannot ban superadmin" });
      if (req.user.role === "admin" && ["admin", "superadmin"].includes(target.role)) {
        return res.status(403).json({ message: "Admins can only ban guests/students" });
      }
      if (!["guest", "student"].includes(target.role)) {
        return res.status(403).json({ message: "Only guests and students can be banned" });
      }
      const reason = (req.body && (req.body.reason || req.body.banReason)) || "";
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: true, banReason: reason, bannedAt: new Date() },
        { new: true }
      ).select("name email role isVerified isBanned banReason bannedAt");
      await ActivityLog.create({
        actor: req.user._id,
        action: "USER_BAN",
        details: { userId: user._id, reason }
      });
      res.json(user);
    } catch (e) {
      res.status(500).json({ message: "Failed to ban user" });
    }
  }
);

// Unban a user
router.patch(
  "/users/:id/unban",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const target = await User.findById(req.params.id);
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.role === "superadmin") return res.status(403).json({ message: "Cannot modify superadmin" });
      if (req.user.role === "admin" && ["admin", "superadmin"].includes(target.role)) {
        return res.status(403).json({ message: "Admins cannot modify admin/superadmin accounts" });
      }
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: false, banReason: "", bannedAt: undefined },
        { new: true }
      ).select("name email role isVerified isBanned banReason bannedAt");
      await ActivityLog.create({
        actor: req.user._id,
        action: "USER_UNBAN",
        details: { userId: user._id }
      });
      res.json(user);
    } catch (e) {
      res.status(500).json({ message: "Failed to unban user" });
    }
  }
);

// Delete a user (superadmin only)
router.delete(
  "/users/:id",
  verifyToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const target = await User.findById(req.params.id);
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.role === "superadmin") return res.status(403).json({ message: "Cannot delete superadmin" });
      await User.findByIdAndDelete(req.params.id);
      await ActivityLog.create({
        actor: req.user._id,
        action: "USER_DELETE",
        details: { userId: target._id, email: target.email }
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  }
);

// USER MANAGEMENT
router.get(
  "/users",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (_req, res) => {
    try {
      const users = await User.find().select("name email role createdAt isVerified isBanned banReason bannedAt");
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
      await ActivityLog.create({
        actor: req.user._id,
        action: "USER_CREATE",
        details: { userId: user._id, email: user.email, role: user.role }
      });
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
      await ActivityLog.create({
        actor: req.user._id,
        action: "USER_ROLE_UPDATE",
        details: { userId: user._id, role }
      });
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
