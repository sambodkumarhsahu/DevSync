const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    path: {
      type: String,
      required: true,
      trim: true,
    },

    language: {
      type: String,
      default: "plaintext",
    },

    content: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate file paths inside the same project
fileSchema.index(
  { project: 1, path: 1 },
  { unique: true }
);

module.exports = mongoose.model("File", fileSchema);