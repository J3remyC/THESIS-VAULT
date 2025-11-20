import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Application } from "../models/application.model.js";
import { Department } from "../models/department.model.js";

const router = express.Router();

// Submit student application
router.post("/", verifyToken, async (req, res) => {
  try {
    const { lastName, firstName, middleInitial, studentNumber, section, course, schoolYear } = req.body;
    if (!lastName || !firstName || !studentNumber || !section || !course || !schoolYear) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const dep = await Department.findOne({ code: course });
    if (!dep) return res.status(400).json({ message: "Invalid course/department code" });

    const existingPending = await Application.findOne({ user: req.user._id, status: "pending" });
    if (existingPending) return res.status(400).json({ message: "You already have a pending application" });

    const appDoc = await Application.create({
      user: req.user._id,
      lastName,
      firstName,
      middleInitial: middleInitial || "",
      studentNumber,
      section,
      course,
      schoolYear,
    });
    res.status(201).json(appDoc);
  } catch (e) {
    res.status(500).json({ message: "Failed to submit application" });
  }
});

// View user's own application(s)
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const apps = await Application.find({ user: req.user._id }).sort({ submittedAt: -1 });
    res.json(apps);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

export default router;
