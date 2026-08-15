const express = require("express");

const Task = require("../models/Task");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// =========================
// CREATE TASK
// =========================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      priority,
      assignee,
    } = req.body;

    if (!title || !project) {
      return res.status(400).json({
        message: "Task title and project are required",
      });
    }

    // Make sure the project belongs to the logged-in user
    const existingProject = await Project.findOne({
      _id: project,
      owner: req.user.userId,
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const task = await Task.create({
      title,
      description: description || "",
      project,
      priority: priority || "medium",
      assignee: assignee || "",
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// GET PROJECT TASKS
// =========================

router.get(
  "/project/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      // Make sure the project belongs to logged-in user
      const project = await Project.findOne({
        _id: projectId,
        owner: req.user.userId,
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const tasks = await Task.find({
        project: projectId,
      }).sort({ createdAt: -1 });

      res.json({
        tasks,
      });
    } catch (error) {
      console.error("Get tasks error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// GET SINGLE TASK
// =========================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Check that the task's project belongs to the user
    const project = await Project.findOne({
      _id: task.project,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.json({
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// UPDATE TASK
// =========================

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assignee,
    } = req.body;

    const existingTask = await Task.findById(req.params.id);

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Check project ownership
    const project = await Project.findOne({
      _id: existingTask.project,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        status,
        priority,
        assignee,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// DELETE TASK
// =========================

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const existingTask = await Task.findById(req.params.id);

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Check project ownership
    const project = await Project.findOne({
      _id: existingTask.project,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;