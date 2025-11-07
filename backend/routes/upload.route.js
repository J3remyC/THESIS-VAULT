import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { File } from "../models/file.model.js";
import { verifyToken } from "../middleware/authMiddleware.js";

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
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: "uploads",
      resource_type: "auto",
    });

    // ✅ Save uploader info in MongoDB
    const newFile = await File.create({
      url: result.secure_url,
      filename: req.file.originalname,
      uploadedBy: req.user._id, // Link uploader
    });

    res.status(200).json({
      message: "File uploaded successfully",
      file: {
        ...newFile.toObject(),
        uploader: {
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ✅ Fetch files and include uploader info
router.get("/", async (req, res) => {
  try {
    const files = await File.find()
      .populate("uploadedBy", "name email") // 👈 this adds name and email
      .sort({ createdAt: -1 });
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch files" });
  }
});


export default router;
