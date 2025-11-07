import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  title: { type: String },
  author: { type: String },
  course: { type: String },
  yearPublished: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export const File = mongoose.model("File", fileSchema);
