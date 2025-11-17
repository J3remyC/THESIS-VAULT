import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  publicId: { type: String },
  resourceType: { type: String },
  format: { type: String },
  title: { type: String },
  description: { type: String },
  author: { type: String },
  course: { type: String },
  yearPublished: { type: Number },
  department: { type: String },
  rejectionReason: { type: String },
  rejectedAt: { type: Date },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true,
  },
  trashed: { type: Boolean, default: false, index: true },
  trashedAt: { type: Date },
  trashReason: { type: String, enum: ["rejected", "deleted", null], default: null },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0, index: true },
  downvotes: { type: Number, default: 0 },
  upvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  downvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

export const File = mongoose.model("File", fileSchema);
