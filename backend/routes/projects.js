const express = require("express");

const Project = require("../models/Project");
const Task = require("../models/Task");
const File = require("../models/File");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// =========================
// CREATE PROJECT
// =========================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || "",
      owner: req.user.userId,
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// GET USER PROJECTS
// =========================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      owner: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json({
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// GET SINGLE PROJECT
// =========================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json({
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// UPDATE PROJECT
// =========================

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.userId,
      },
      {
        name: name.trim(),
        description: description || "",
        ...(status ? { status } : {}),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// DELETE PROJECT
// =========================

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Delete project tasks
    await Task.deleteMany({
      project: project._id,
    });

    // Delete project files
    await File.deleteMany({
      project: project._id,
    });

    // Delete project
    await Project.findByIdAndDelete(project._id);

    res.json({
      message: "Project, files and tasks deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;