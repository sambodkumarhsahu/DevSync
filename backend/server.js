const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const fileRoutes = require("./routes/files");

dotenv.config();

const app = express();

// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// =========================
// STATIC UPLOADED FILES
// =========================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// =========================
// ROUTES
// =========================

app.get("/", (req, res) => {
  res.json({
    message: "DevSync API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "DevSync backend is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/files", fileRoutes);

// =========================
// DATABASE
// =========================

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(
        `DevSync API running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error.message);
  });