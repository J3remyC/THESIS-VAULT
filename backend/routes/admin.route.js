import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { File } from "../models/file.model.js";
import { User } from "../models/user.model.js";
import { Department } from "../models/department.model.js";
import { ActivityLog } from "../models/activityLog.model.js";

const router = express.Router();

// List theses with optional filters
router.get(
  "/theses",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const { department, status } = req.query;
      const query = {};
      if (department) query.department = department;
      if (status) query.status = status;
      const files = await File.find(query)
        .populate("uploadedBy", "name email role")
        .sort({ createdAt: -1 });
      res.json(files);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch theses" });
    }
  }
);

// Alias: all submissions
router.get(
  "/theses/all",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const files = await File.find({})
        .populate("uploadedBy", "name email role")
        .sort({ createdAt: -1 });
      res.json(files);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch all theses" });
    }
  }
);

// List pending theses
router.get(
  "/theses/pending",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const files = await File.find({ status: "pending" })
        .populate("uploadedBy", "name email role")
        .sort({ createdAt: -1 });
      res.json(files);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch pending theses" });
    }
  }
);

// Approve thesis
router.patch(
  "/theses/:id/approve",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const file = await File.findByIdAndUpdate(
        req.params.id,
        { status: "approved" },
        { new: true }
      );
      if (!file) return res.status(404).json({ message: "Not found" });
      await ActivityLog.create({
        actor: req.user._id,
        action: "APPROVE_THESIS",
        details: { fileId: file._id },
      });
      res.json(file);
    } catch (e) {
      res.status(500).json({ message: "Failed to approve thesis" });
    }
  }
);

// Reject thesis
router.patch(
  "/theses/:id/reject",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const file = await File.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true }
      );
      if (!file) return res.status(404).json({ message: "Not found" });
      await ActivityLog.create({
        actor: req.user._id,
        action: "REJECT_THESIS",
        details: { fileId: file._id },
      });
      res.json(file);
    } catch (e) {
      res.status(500).json({ message: "Failed to reject thesis" });
    }
  }
);

// Metrics
router.get(
  "/metrics",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (_req, res) => {
    try {
      const [students, admins, theses, departments] = await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "admin" }),
        File.countDocuments({}),
        Department.countDocuments({}),
      ]);
      res.json({
        totalStudents: students,
        totalTeachers: admins, // NOTE: using admins as teachers per current roles
        totalTheses: theses,
        totalDepartments: departments,
      });
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  }
);

// Activity logs
router.get(
  "/logs",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (_req, res) => {
    try {
      const logs = await ActivityLog.find()
        .populate("actor", "name email role")
        .sort({ createdAt: -1 })
        .limit(200);
      res.json(logs);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  }
);

export default router;
