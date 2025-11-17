import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { Readable } from "stream";
import { File } from "../models/file.model.js";
import { Department } from "../models/department.model.js";
import { ActivityLog } from "../models/activityLog.model.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

dotenv.config();
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Secure file upload route
router.post("/", verifyToken, authorizeRoles("student", "admin", "superadmin"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { title, author, course, yearPublished, department, description } = req.body;

    // Validate department (expecting department code)
    if (!department) return res.status(400).json({ message: "Department code is required" });
    const dep = await Department.findOne({ code: department });
    if (!dep) return res.status(400).json({ message: "Invalid department code" });

    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: "uploads",
      resource_type: "auto",
      use_filename: true,
      unique_filename: false,
      filename_override: req.file.originalname,
    });

    const newFile = await File.create({
      url: result.secure_url,
      filename: req.file.originalname,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      uploadedBy: req.user._id,
      title,
      description,
      author,
      course,
      yearPublished,
      department, // store department code for now
    });

    // Log user upload
    await ActivityLog.create({
      actor: req.user._id,
      action: "UPLOAD_THESIS",
      details: { fileId: newFile._id, title: newFile.title },
    });

    res.status(200).json({
      message: "File uploaded successfully",
      file: newFile,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ✅ Vote on a thesis (up or down)
router.post("/:id/vote", verifyToken, async (req, res) => {
  try {
    const { type } = req.body; // 'up' or 'down'
    if (!['up','down'].includes(type)) return res.status(400).json({ message: 'Invalid vote type' });
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Not found' });

    const uid = String(req.user._id);
    const upSet = new Set(file.upvoters.map(String));
    const downSet = new Set(file.downvoters.map(String));

    // Remove from both first (toggle behavior)
    upSet.delete(uid);
    downSet.delete(uid);

    if (type === 'up') upSet.add(uid);
    else downSet.add(uid);

    file.upvoters = Array.from(upSet);
    file.downvoters = Array.from(downSet);
    file.upvotes = file.upvoters.length;
    file.downvotes = file.downvoters.length;
    await file.save();

    return res.json(file);
  } catch (err) {
    res.status(500).json({ message: 'Failed to vote' });
  }
});


// ✅ Fetch files and include uploader info
// Public list: only approved files
router.get("/", async (req, res) => {
  try {
    const files = await File.find({ status: "approved" })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch files" });
  }
});

// Authenticated list of own uploads (any status)
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user's files" });
  }
});

// ✅ Update own upload (metadata only)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "Not found" });
    if (String(file.uploadedBy) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

    const updates = {};
    const { title, author, course, yearPublished, department, description } = req.body;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (author !== undefined) updates.author = author;
    if (course !== undefined) updates.course = course;
    if (yearPublished !== undefined) updates.yearPublished = yearPublished;
    if (department !== undefined) {
      const dep = await Department.findOne({ code: department });
      if (!dep) return res.status(400).json({ message: "Invalid department code" });
      updates.department = department;
    }

    const updated = await File.findByIdAndUpdate(req.params.id, updates, { new: true });
    await ActivityLog.create({
      actor: req.user._id,
      action: "EDIT_THESIS",
      details: { fileId: updated._id, updates },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update file" });
  }
});

// ✅ Delete own upload
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "Not found" });
    if (String(file.uploadedBy) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

    await File.findByIdAndUpdate(req.params.id, { trashed: true, trashedAt: new Date() }, { new: true });
    await ActivityLog.create({
      actor: req.user._id,
      action: "TRASH_THESIS",
      details: { fileId: req.params.id, title: file.title },
    });
    res.json({ message: "Moved to trash" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete file" });
  }
});

// ✅ List own trashed uploads
router.get("/trash/mine", verifyToken, async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id, trashed: true }).sort({ trashedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trashed files" });
  }
});

// ✅ User's own activity logs
router.get("/logs/mine", verifyToken, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ actor: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// ✅ Download file
router.get("/:id/download", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "Not found" });

    const original = file.filename || "file";

    // If we have a Cloudinary publicId, generate an attachment URL via SDK
    if (file.publicId) {
      const url = cloudinary.url(file.publicId, {
        resource_type: file.resourceType || "auto",
        flags: "attachment",
        filename: original,
        secure: true,
      });
      return res.redirect(302, url);
    }

    // Fallback: stream with explicit headers
    const ext = path.extname(original).toLowerCase();
    let mime = "application/octet-stream";
    if (ext === ".pdf") mime = "application/pdf";
    else if (ext === ".docx") mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".doc") mime = "application/msword";

    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `attachment; filename="${original}"`);

    const r = await fetch(file.url);
    if (!r.ok || !r.body) return res.status(502).json({ message: "Upstream download failed" });
    const nodeStream = typeof Readable.fromWeb === "function" && r.body?.getReader ? Readable.fromWeb(r.body) : r.body;
    nodeStream.pipe(res);
  } catch (err) {
    console.error("Download error", err);
    res.status(500).json({ message: "Failed to download" });
  }
});

export default router;
