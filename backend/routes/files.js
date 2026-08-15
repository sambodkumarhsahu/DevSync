const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const net = require("net");
const { spawn } = require("child_process");

const File = require("../models/File");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// =====================================================
// RUNTIME CONFIG
// =====================================================

const RUNTIME_ROOT = path.join(
  __dirname,
  "..",
  "runtime-projects"
);

// Keep running processes in memory.
// This is fine for local development.
const runningProjects = new Map();

// =====================================================
// HELPERS
// =====================================================

function normalizeProjectPath(filePath) {
  return String(filePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/g, "")
    .replace(/\/+/g, "/");
}

function isUnsafePath(filePath) {
  const normalized = normalizeProjectPath(filePath);

  if (!normalized) {
    return true;
  }

  const parts = normalized.split("/");

  return (
    parts.includes("..") ||
    parts.includes("node_modules") ||
    parts.includes(".git") ||
    parts.includes(".next")
  );
}

function getSafeRuntimePath(projectId) {
  const id = String(projectId);

  // Mongo ObjectIds are hex strings.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid project ID");
  }

  return path.join(RUNTIME_ROOT, id);
}

async function ensureRuntimeRoot() {
  await fsp.mkdir(RUNTIME_ROOT, {
    recursive: true,
  });
}

function getNpmCommand() {
  return process.platform === "win32"
    ? "npm.cmd"
    : "npm";
}

function findAvailablePort(startPort = 3001) {
  return new Promise((resolve, reject) => {
    let port = startPort;

    const tryPort = () => {
      const server = net.createServer();

      server.once("error", () => {
        port += 1;
        tryPort();
      });

      server.once("listening", () => {
        server.close(() => {
          resolve(port);
        });
      });

      server.listen(port, "127.0.0.1");
    };

    tryPort();
  });
}

// =====================================================
// WRITE PROJECT FROM MONGODB TO DISK
// =====================================================

async function writeProjectToDisk(projectId, files) {
  const runtimePath = getSafeRuntimePath(projectId);

  await ensureRuntimeRoot();

  // Completely replace the runtime copy.
  await fsp.rm(runtimePath, {
    recursive: true,
    force: true,
  });

  await fsp.mkdir(runtimePath, {
    recursive: true,
  });

  for (const file of files) {
    const cleanPath = normalizeProjectPath(file.path);

    if (isUnsafePath(cleanPath)) {
      continue;
    }

    const destination = path.resolve(
      runtimePath,
      cleanPath
    );

    // Extra protection against path traversal.
    if (
      destination !== runtimePath &&
      !destination.startsWith(
        runtimePath + path.sep
      )
    ) {
      continue;
    }

    await fsp.mkdir(
      path.dirname(destination),
      {
        recursive: true,
      }
    );

    await fsp.writeFile(
      destination,
      typeof file.content === "string"
        ? file.content
        : "",
      "utf8"
    );
  }

  return runtimePath;
}

// =====================================================
// GET PROJECT FILES
// =====================================================

router.get(
  "/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      const project = await Project.findOne({
        _id: req.params.projectId,
        owner: req.user.userId,
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      let files = await File.find({
        project: project._id,
      }).sort({ path: 1 });

      // Create starter files if project has no files
      if (files.length === 0) {
        const starterFiles = [
          {
            project: project._id,
            name: "App.tsx",
            path: "src/App.tsx",
            language: "typescript",
            content: `import React from "react";

export default function App() {
  return (
    <main>
      <h1>Hello from ${project.name}</h1>

      <p>
        Build your project together with DevSync.
      </p>
    </main>
  );
}
`,
          },
          {
            project: project._id,
            name: "api.ts",
            path: "src/api.ts",
            language: "typescript",
            content: `export async function getProject() {
  const response = await fetch("/api/project");

  if (!response.ok) {
    throw new Error("Failed to load project");
  }

  return response.json();
}
`,
          },
          {
            project: project._id,
            name: "package.json",
            path: "package.json",
            language: "json",
            content: `{
  "name": "devsync-project",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
`,
          },
          {
            project: project._id,
            name: "README.md",
            path: "README.md",
            language: "markdown",
            content: `# ${project.name}

Build your project together with DevSync.

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
          },
        ];

        files = await File.insertMany(
          starterFiles
        );
      }

      res.json({
        files,
      });
    } catch (error) {
      console.error(
        "Get files error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// UPLOAD COMPLETE PROJECT
// =====================================================

router.post(
  "/:projectId/upload",
  authMiddleware,
  async (req, res) => {
    try {
      const { files } = req.body;

      if (!Array.isArray(files)) {
        return res.status(400).json({
          message: "Files must be an array",
        });
      }

      if (files.length === 0) {
        return res.status(400).json({
          message: "No files were provided",
        });
      }

      const project = await Project.findOne({
        _id: req.params.projectId,
        owner: req.user.userId,
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const cleanedFiles = [];

      for (const incomingFile of files) {
        if (
          !incomingFile ||
          !incomingFile.path
        ) {
          continue;
        }

        const cleanPath =
          normalizeProjectPath(
            incomingFile.path
          );

        if (isUnsafePath(cleanPath)) {
          continue;
        }

        const fileName =
          incomingFile.name ||
          cleanPath.split("/").pop();

        cleanedFiles.push({
          project: project._id,
          name: String(fileName),
          path: cleanPath,
          language:
            incomingFile.language ||
            "plaintext",
          content:
            typeof incomingFile.content ===
            "string"
              ? incomingFile.content
              : "",
        });
      }

      if (cleanedFiles.length === 0) {
        return res.status(400).json({
          message:
            "No usable files were found",
        });
      }

      await File.deleteMany({
        project: project._id,
      });

      const importedFiles =
        await File.insertMany(
          cleanedFiles,
          {
            ordered: false,
          }
        );

      const sortedFiles =
        importedFiles.sort((a, b) =>
          a.path.localeCompare(b.path)
        );

      res.status(201).json({
        message:
          "Project uploaded successfully",
        count: sortedFiles.length,
        files: sortedFiles,
      });
    } catch (error) {
      console.error(
        "Project upload error:",
        error
      );

      res.status(500).json({
        message: "Failed to upload project",
        error: error.message,
      });
    }
  }
);

// =====================================================
// CREATE FILE
// =====================================================

router.post(
  "/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        path: filePath,
        language,
        content,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          message:
            "File name is required",
        });
      }

      if (
        !filePath ||
        !filePath.trim()
      ) {
        return res.status(400).json({
          message:
            "File path is required",
        });
      }

      const cleanPath =
        normalizeProjectPath(
          filePath
        );

      if (isUnsafePath(cleanPath)) {
        return res.status(400).json({
          message:
            "Invalid file path",
        });
      }

      const project =
        await Project.findOne({
          _id: req.params.projectId,
          owner: req.user.userId,
        });

      if (!project) {
        return res.status(404).json({
          message:
            "Project not found",
        });
      }

      const existingFile =
        await File.findOne({
          project: project._id,
          path: cleanPath,
        });

      if (existingFile) {
        return res.status(400).json({
          message:
            "A file with this path already exists",
        });
      }

      const file =
        await File.create({
          project: project._id,
          name: name.trim(),
          path: cleanPath,
          language:
            language || "plaintext",
          content: content || "",
        });

      res.status(201).json({
        message:
          "File created successfully",
        file,
      });
    } catch (error) {
      console.error(
        "Create file error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// UPDATE FILE
// =====================================================

router.put(
  "/:projectId/:fileId",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        path: filePath,
        language,
        content,
      } = req.body;

      const project =
        await Project.findOne({
          _id: req.params.projectId,
          owner: req.user.userId,
        });

      if (!project) {
        return res.status(404).json({
          message:
            "Project not found",
        });
      }

      if (
        filePath !== undefined &&
        isUnsafePath(filePath)
      ) {
        return res.status(400).json({
          message:
            "Invalid file path",
        });
      }

      const file =
        await File.findOneAndUpdate(
          {
            _id: req.params.fileId,
            project: project._id,
          },
          {
            ...(name !== undefined
              ? {
                  name: name.trim(),
                }
              : {}),

            ...(filePath !== undefined
              ? {
                  path:
                    normalizeProjectPath(
                      filePath
                    ),
                }
              : {}),

            ...(language !== undefined
              ? { language }
              : {}),

            ...(content !== undefined
              ? { content }
              : {}),
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!file) {
        return res.status(404).json({
          message:
            "File not found",
        });
      }

      res.json({
        message:
          "File saved successfully",
        file,
      });
    } catch (error) {
      console.error(
        "Update file error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// RUN PROJECT
// =====================================================

router.post(
  "/:projectId/run",
  authMiddleware,
  async (req, res) => {
    try {
      const project =
        await Project.findOne({
          _id: req.params.projectId,
          owner: req.user.userId,
        });

      if (!project) {
        return res.status(404).json({
          message:
            "Project not found",
        });
      }

      // Stop an existing process first.
      const existing =
        runningProjects.get(
          String(project._id)
        );

      if (existing) {
        try {
          existing.process.kill();
        } catch {}

        runningProjects.delete(
          String(project._id)
        );
      }

      const files =
        await File.find({
          project: project._id,
        }).sort({ path: 1 });

      if (files.length === 0) {
        return res.status(400).json({
          message:
            "Project has no files",
        });
      }

      const packageFile =
        files.find(
          (file) =>
            file.path ===
            "package.json"
        );

      if (!packageFile) {
        return res.status(400).json({
          message:
            "package.json not found. DevSync currently runs Node.js projects with npm.",
        });
      }

      let packageJson;

      try {
        packageJson =
          JSON.parse(
            packageFile.content || "{}"
          );
      } catch {
        return res.status(400).json({
          message:
            "package.json contains invalid JSON",
        });
      }

      if (
        !packageJson.scripts ||
        !packageJson.scripts.dev
      ) {
        return res.status(400).json({
          message:
            'No "dev" script found in package.json',
        });
      }

      // Write MongoDB files to an actual
      // project directory.
      const runtimePath =
        await writeProjectToDisk(
          project._id,
          files
        );

      // Pick a free local port.
      const port =
        await findAvailablePort(
          3001
        );

      const npmCommand =
        getNpmCommand();

      // -------------------------------------------------
      // Install dependencies if node_modules doesn't exist
      // -------------------------------------------------

      res.json({
        message:
          "Project is starting...",
        status: "installing",
        port,
      });

      console.log(
        `Installing dependencies for project ${project._id}...`
      );

      const installProcess =
        spawn(
          npmCommand,
          ["install"],
          {
            cwd: runtimePath,
            shell: false,
            windowsHide: true,
          }
        );

      let installOutput = "";

      installProcess.stdout.on(
        "data",
        (data) => {
          const text =
            data.toString();

          installOutput += text;

          console.log(
            `[${project._id}] ${text.trim()}`
          );
        }
      );

      installProcess.stderr.on(
        "data",
        (data) => {
          const text =
            data.toString();

          installOutput += text;

          console.log(
            `[${project._id}] ${text.trim()}`
          );
        }
      );

      installProcess.on(
        "error",
        (error) => {
          console.error(
            "npm install failed:",
            error
          );
        }
      );

      installProcess.on(
        "close",
        (installCode) => {
          if (installCode !== 0) {
            console.error(
              `npm install exited with code ${installCode}`
            );

            return;
          }

          console.log(
            `Dependencies installed for ${project._id}`
          );

          // -------------------------------------------------
          // START DEV SERVER
          // -------------------------------------------------

          const devProcess =
            spawn(
              npmCommand,
              [
                "run",
                "dev",
                "--",
                "--port",
                String(port),
              ],
              {
                cwd: runtimePath,
                shell: false,
                windowsHide: true,
              }
            );

          runningProjects.set(
            String(project._id),
            {
              process: devProcess,
              port,
              runtimePath,
            }
          );

          devProcess.stdout.on(
            "data",
            (data) => {
              console.log(
                `[DEV ${project._id}] ${data
                  .toString()
                  .trim()}`
              );
            }
          );

          devProcess.stderr.on(
            "data",
            (data) => {
              console.log(
                `[DEV ${project._id}] ${data
                  .toString()
                  .trim()}`
              );
            }
          );

          devProcess.on(
            "close",
            (code) => {
              console.log(
                `Project ${project._id} stopped with code ${code}`
              );

              runningProjects.delete(
                String(project._id)
              );
            }
          );

          devProcess.on(
            "error",
            (error) => {
              console.error(
                `Project ${project._id} process error:`,
                error
              );

              runningProjects.delete(
                String(project._id)
              );
            }
          );

          console.log(
            `DevSync project running on http://localhost:${port}`
          );
        }
      );
    } catch (error) {
      console.error(
        "Run project error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to start project",
        error: error.message,
      });
    }
  }
);

// =====================================================
// PROJECT STATUS
// =====================================================

router.get(
  "/:projectId/status",
  authMiddleware,
  async (req, res) => {
    try {
      const project =
        await Project.findOne({
          _id: req.params.projectId,
          owner: req.user.userId,
        });

      if (!project) {
        return res.status(404).json({
          message:
            "Project not found",
        });
      }

      const running =
        runningProjects.get(
          String(project._id)
        );

      if (!running) {
        return res.json({
          running: false,
        });
      }

      res.json({
        running: true,
        port: running.port,
        url: `http://localhost:${running.port}`,
      });
    } catch (error) {
      console.error(
        "Project status error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to get project status",
      });
    }
  }
);

// =====================================================
// STOP PROJECT
// =====================================================

router.post(
  "/:projectId/stop",
  authMiddleware,
  async (req, res) => {
    try {
      const project =
        await Project.findOne({
          _id: req.params.projectId,
          owner: req.user.userId,
        });

      if (!project) {
        return res.status(404).json({
          message:
            "Project not found",
        });
      }

      const running =
        runningProjects.get(
          String(project._id)
        );

      if (!running) {
        return res.json({
          message:
            "Project is not running",
          running: false,
        });
      }

      try {
        running.process.kill();
      } catch {}

      runningProjects.delete(
        String(project._id)
      );

      res.json({
        message:
          "Project stopped successfully",
        running: false,
      });
    } catch (error) {
      console.error(
        "Stop project error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to stop project",
      });
    }
  }
);

// =====================================================
// DELETE FILE
// =====================================================

router.delete(
  "/:projectId/:fileId",
  authMiddleware,
  async (req, res) => {
    try {
      const project =
        await Project.findOne({
          _id: req.params.projectId,
          owner: req.user.userId,
        });

      if (!project) {
        return res.status(404).json({
          message:
            "Project not found",
        });
      }

      const file =
        await File.findOneAndDelete({
          _id: req.params.fileId,
          project: project._id,
        });

      if (!file) {
        return res.status(404).json({
          message:
            "File not found",
        });
      }

      res.json({
        message:
          "File deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete file error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;