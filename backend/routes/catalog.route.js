import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Department } from "../models/department.model.js";

const router = express.Router();

// List departments (courses) for authenticated users
router.get("/departments", verifyToken, async (_req, res) => {
  try {
    const list = await Department.find().sort({ name: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch departments" });
  }
});

export default router;
