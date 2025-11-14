import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
  middleInitial: { type: String },
  section: { type: String, required: true },
  course: { type: String, required: true }, // department code
  schoolYear: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  reason: { type: String },
  submittedAt: { type: Date, default: Date.now },
  decidedAt: { type: Date },
});

export const Application = mongoose.model("Application", applicationSchema);
