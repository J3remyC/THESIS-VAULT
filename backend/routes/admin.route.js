import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { File } from "../models/file.model.js";
import { User } from "../models/user.model.js";
import { Department } from "../models/department.model.js";
import { ActivityLog } from "../models/activityLog.model.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { Application } from "../models/application.model.js";

const router = express.Router();

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// List theses with optional filters
router.get(
  "/theses",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const { department, status } = req.query;
      const query = { trashed: { $ne: true } };
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

// Student Applications — list for review
router.get(
  "/applications",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const { status } = req.query;
      const q = {};
      if (status) q.status = status;
      const apps = await Application.find(q)
        .populate("user", "name email role")
        .sort({ submittedAt: -1 });
      res.json(apps);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  }
);

// Approve application and grant student role
router.patch(
  "/applications/:id/approve",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const appDoc = await Application.findByIdAndUpdate(
        req.params.id,
        { status: "approved", decidedAt: new Date() },
        { new: true }
      );
      if (!appDoc) return res.status(404).json({ message: "Not found" });
      await User.findByIdAndUpdate(appDoc.user, { role: "student" });
      await ActivityLog.create({
        actor: req.user._id,
        action: "APP_APPROVE",
        details: { applicationId: appDoc._id, userId: appDoc.user },
      });
      res.json(appDoc);
    } catch (e) {
      res.status(500).json({ message: "Failed to approve application" });
    }
  }
);

// Reject application
router.patch(
  "/applications/:id/reject",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const reason = (req.body && (req.body.reason || req.body.rejectionReason)) || "";
      const appDoc = await Application.findByIdAndUpdate(
        req.params.id,
        { status: "rejected", reason, decidedAt: new Date() },
        { new: true }
      );
      if (!appDoc) return res.status(404).json({ message: "Not found" });
      await ActivityLog.create({
        actor: req.user._id,
        action: "APP_REJECT",
        details: { applicationId: appDoc._id, userId: appDoc.user, reason },
      });
      res.json(appDoc);
    } catch (e) {
      res.status(500).json({ message: "Failed to reject application" });
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
      const reason = (req.body && (req.body.reason || req.body.rejectionReason)) || "";
      const file = await File.findByIdAndUpdate(
        req.params.id,
        { status: "rejected", rejectionReason: reason, rejectedAt: new Date(), trashed: true, trashedAt: new Date(), trashReason: 'rejected' },
        { new: true }
      );
      if (!file) return res.status(404).json({ message: "Not found" });
      await ActivityLog.create({
        actor: req.user._id,
        action: "REJECT_THESIS",
        details: { fileId: file._id, reason },
      });
      res.json(file);
    } catch (e) {
      res.status(500).json({ message: "Failed to reject thesis" });
    }
  }
);

// Purge all rejected (immediate deletion)
router.post(
  "/theses/purge-rejected",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (_req, res) => {
    try {
      const rejected = await File.find({ status: "rejected" });
      let count = 0;
      for (const f of rejected) {
        try {
          if (f.publicId) await cloudinary.uploader.destroy(f.publicId, { resource_type: f.resourceType || "raw" });
        } catch {}
        try {
          await File.findByIdAndDelete(f._id);
          count++;
        } catch {}
      }
      res.json({ message: "Purged rejected theses", count });
    } catch (e) {
      res.status(500).json({ message: "Failed to purge rejected" });
    }
  }
);

// Update thesis metadata
router.patch(
  "/theses/:id",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const allowed = [
        "title",
        "description",
        "author",
        "course",
        "yearPublished",
        "department",
        "status",
      ];
      const updates = {};
      for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

      const file = await File.findByIdAndUpdate(req.params.id, updates, {
        new: true,
      }).populate("uploadedBy", "name email role");
      if (!file) return res.status(404).json({ message: "Not found" });

      await ActivityLog.create({
        actor: req.user._id,
        action: "UPDATE_THESIS",
        details: { fileId: file._id, updates },
      });

      res.json(file);
    } catch (e) {
      res.status(500).json({ message: "Failed to update thesis" });
    }
  }
);

// Soft-delete (move to trash)
router.delete(
  "/theses/:id",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const file = await File.findByIdAndUpdate(
        req.params.id,
        { trashed: true, trashedAt: new Date(), trashReason: 'deleted' },
        { new: true }
      );
      if (!file) return res.status(404).json({ message: "Not found" });
      await ActivityLog.create({
        actor: req.user._id,
        action: "TRASH_THESIS",
        details: { fileId: file._id },
      });
      res.json({ message: "Moved to trash" });
    } catch (e) {
      res.status(500).json({ message: "Failed to move to trash" });
    }
  }
);

// List trashed theses
router.get(
  "/theses/trash",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (_req, res) => {
    try {
      const files = await File.find({ trashed: true }).populate("uploadedBy", "name email role").sort({ trashedAt: -1 });
      res.json(files);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch trash" });
    }
  }
);

// Restore from trash
router.post(
  "/theses/:id/restore",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const file = await File.findByIdAndUpdate(
        req.params.id,
        { trashed: false, trashedAt: null },
        { new: true }
      );
      if (!file) return res.status(404).json({ message: "Not found" });
      await ActivityLog.create({
        actor: req.user._id,
        action: "RESTORE_THESIS",
        details: { fileId: file._id },
      });
      res.json(file);
    } catch (e) {
      res.status(500).json({ message: "Failed to restore thesis" });
    }
  }
);

// Permanently delete (purge)
router.delete(
  "/theses/:id/purge",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const file = await File.findById(req.params.id);
      if (!file) return res.status(404).json({ message: "Not found" });

      if (file.publicId) {
        try {
          await cloudinary.uploader.destroy(file.publicId, { resource_type: file.resourceType || "raw" });
        } catch (_err) {}
      }

      await File.findByIdAndDelete(file._id);
      await ActivityLog.create({ actor: req.user._id, action: "PURGE_THESIS", details: { fileId: file._id } });
      res.json({ message: "Thesis permanently deleted" });
    } catch (e) {
      res.status(500).json({ message: "Failed to purge thesis" });
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
  async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page || "1", 10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
      const skip = (page - 1) * limit;
      const adminUsers = await User.find({ role: { $in: ["admin", "superadmin"] } }).select("_id");
      const adminIds = adminUsers.map((u) => u._id);
      const filter = { actor: { $in: adminIds } };
      const [total, logs] = await Promise.all([
        ActivityLog.countDocuments(filter),
        ActivityLog.find(filter)
          .populate("actor", "name email role")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
      ]);
      const items = logs.map((l) => {
        let detailText = "";
        const d = l.details || {};
        if (l.action === "APPROVE_THESIS") detailText = `Approved thesis ${d.fileId || ""}`;
        else if (l.action === "REJECT_THESIS") detailText = `Rejected thesis ${d.fileId || ""}${d.reason ? `, reason: ${d.reason}` : ""}`;
        else if (l.action === "UPDATE_THESIS") detailText = `Updated thesis ${d.fileId || ""}`;
        else if (l.action === "TRASH_THESIS") detailText = `Moved thesis ${d.fileId || ""} to trash`;
        else if (l.action === "RESTORE_THESIS") detailText = `Restored thesis ${d.fileId || ""} from trash`;
        else if (l.action === "PURGE_THESIS") detailText = `Permanently deleted thesis ${d.fileId || ""}`;
        else if (l.action === "APP_APPROVE") detailText = `Approved application ${d.applicationId || ""}`;
        else if (l.action === "APP_REJECT") detailText = `Rejected application ${d.applicationId || ""}${d.reason ? `, reason: ${d.reason}` : ""}`;
        return { ...l.toObject(), detailText };
      });
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      res.json({ items, page, limit, total, totalPages });
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  }
);

export default router;
