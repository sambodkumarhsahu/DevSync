"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  _id: string;
  name: string;
  description?: string;
};

type Task = {
  _id: string;
  title: string;
  description?: string;
  project: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignee?: string;
};

const API = "http://localhost:5000";

export default function DashboardPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [selectedProject, setSelectedProject] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [assignee, setAssignee] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // AUTH
  // =========================

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("devsync_token");
  }

  function getAuthHeaders() {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  }

  function handleLogout() {
    localStorage.removeItem("devsync_token");
    localStorage.removeItem("devsync_user");
    window.location.href = "/login";
  }

  // =========================
  // OPEN WORKSPACE
  // =========================

  function openWorkspace(projectId: string) {
    router.push(`/workspace/${projectId}`);
  }

  // =========================
  // LOAD PROJECTS
  // =========================

  async function loadProjects() {
    try {
      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API}/api/projects`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load projects");
      }

      const loadedProjects = data.projects || [];

      setProjects(loadedProjects);

      if (loadedProjects.length > 0) {
        setSelectedProject(loadedProjects[0]._id);
      } else {
        setSelectedProject("");
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load your projects.");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // LOAD TASKS
  // =========================

  async function loadTasks(projectId: string) {
    try {
      setError("");

      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API}/api/tasks/project/${projectId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load tasks");
      }

      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
      setError("Could not load tasks.");
      setTasks([]);
    }
  }

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    loadProjects();
  }, []);

  // =========================
  // PROJECT CHANGE
  // =========================

  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      return;
    }

    loadTasks(selectedProject);
  }, [selectedProject]);

  // =========================
  // CREATE PROJECT
  // =========================

  async function handleCreateProject(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!projectName.trim()) return;

    setCreatingProject(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API}/api/projects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create project"
        );
      }

      setProjects((current) => [
        data.project,
        ...current,
      ]);

      setSelectedProject(data.project._id);

      setProjectName("");
      setProjectDescription("");
      setShowProjectModal(false);
    } catch (err) {
      console.error(err);
      setError("Could not create project.");
    } finally {
      setCreatingProject(false);
    }
  }

  // =========================
  // DELETE PROJECT
  // =========================

  async function deleteProject() {
    if (!selectedProject || deletingProject) return;

    const project = projects.find(
      (item) => item._id === selectedProject
    );

    if (!project) return;

    const confirmed = window.confirm(
      `Delete "${project.name}"?\n\nAll tasks inside this project will also be deleted. This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingProject(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API}/api/projects/${selectedProject}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete project"
        );
      }

      const remainingProjects = projects.filter(
        (item) => item._id !== selectedProject
      );

      setProjects(remainingProjects);

      if (remainingProjects.length > 0) {
        setSelectedProject(remainingProjects[0]._id);
      } else {
        setSelectedProject("");
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setError("Could not delete project.");
    } finally {
      setDeletingProject(false);
    }
  }

  // =========================
  // CREATE TASK
  // =========================

  async function handleCreateTask(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!selectedProject) {
      setError("Please create a project first.");
      return;
    }

    if (!title.trim()) return;

    setCreating(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          project: selectedProject,
          priority,
          assignee: assignee.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create task"
        );
      }

      setTasks((current) => [
        data.task,
        ...current,
      ]);

      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssignee("");

      setShowTaskModal(false);
    } catch (err) {
      console.error(err);
      setError("Could not create task.");
    } finally {
      setCreating(false);
    }
  }

  // =========================
  // UPDATE TASK STATUS
  // =========================

  async function moveTask(
    taskId: string,
    status: "todo" | "in-progress" | "done"
  ) {
    const task = tasks.find(
      (item) => item._id === taskId
    );

    if (!task) return;

    try {
      setError("");

      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API}/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title: task.title,
            description: task.description || "",
            status,
            priority: task.priority,
            assignee: task.assignee || "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update task"
        );
      }

      setTasks((current) =>
        current.map((item) =>
          item._id === taskId
            ? data.task
            : item
        )
      );
    } catch (err) {
      console.error(err);
      setError("Could not update task.");
    }
  }

  // =========================
  // DELETE TASK
  // =========================

  async function deleteTask(taskId: string) {
    const confirmed = window.confirm(
      "Delete this task?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API}/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete task"
        );
      }

      setTasks((current) =>
        current.filter(
          (task) => task._id !== taskId
        )
      );
    } catch (err) {
      console.error(err);
      setError("Could not delete task.");
    }
  }

  // =========================
  // DATA
  // =========================

  const todo = tasks.filter(
    (task) => task.status === "todo"
  );

  const progress = tasks.filter(
    (task) => task.status === "in-progress"
  );

  const done = tasks.filter(
    (task) => task.status === "done"
  );

  const currentProject = projects.find(
    (project) => project._id === selectedProject
  );

  // =========================
  // TASK CARD
  // =========================

  function TaskCard({ task }: { task: Task }) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-zinc-200">
              {task.title}
            </h3>

            {task.description && (
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                {task.description}
              </p>
            )}

            {task.assignee && (
              <p className="mt-2 text-xs text-zinc-700">
                Assigned to {task.assignee}
              </p>
            )}
          </div>

          <span
            className={`shrink-0 rounded-md px-2 py-1 text-[10px] ${
              task.priority === "high"
                ? "bg-red-500/10 text-red-400"
                : task.priority === "medium"
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {task.priority}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {task.status !== "todo" && (
            <button
              onClick={() =>
                moveTask(task._id, "todo")
              }
              className="rounded-md border border-zinc-800 px-2 py-1 text-[10px] text-zinc-500 hover:border-zinc-600 hover:text-white"
            >
              Todo
            </button>
          )}

          {task.status !== "in-progress" && (
            <button
              onClick={() =>
                moveTask(task._id, "in-progress")
              }
              className="rounded-md border border-zinc-800 px-2 py-1 text-[10px] text-zinc-500 hover:border-zinc-600 hover:text-white"
            >
              Progress
            </button>
          )}

          {task.status !== "done" && (
            <button
              onClick={() =>
                moveTask(task._id, "done")
              }
              className="rounded-md border border-zinc-800 px-2 py-1 text-[10px] text-zinc-500 hover:border-zinc-600 hover:text-white"
            >
              Done
            </button>
          )}

          <button
            onClick={() => deleteTask(task._id)}
            className="ml-auto rounded-md px-2 py-1 text-[10px] text-zinc-700 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // COLUMN
  // =========================

  function Column({
    title,
    items,
    dot,
  }: {
    title: string;
    items: Task[];
    dot: string;
  }) {
    return (
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${dot}`}
            />

            <span className="text-sm font-medium">
              {title}
            </span>
          </div>

          <span className="text-xs text-zinc-600">
            {items.length}
          </span>
        </div>

        <div className="space-y-3">
          {items.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
            />
          ))}

          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-xs text-zinc-700">
              No tasks
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <main className="min-h-screen bg-black text-white">
      {/* NAVBAR */}

      <header className="border-b border-zinc-900">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <a
              href="/"
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">
                D
              </div>

              <span className="font-semibold">
                DevSync
              </span>
            </a>

            <span className="hidden text-sm text-zinc-700 md:block">
              /
            </span>

            <span className="hidden text-sm text-zinc-400 md:block">
              Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-zinc-600 sm:block">
              {currentProject?.name || "No project"}
            </span>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs">
              S
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        {/* SIDEBAR */}

        <aside className="hidden min-h-[calc(100vh-65px)] w-60 border-r border-zinc-900 p-5 lg:block">
          <div className="space-y-1">
            {[
              "Overview",
              "Projects",
              "Tasks",
              "Team",
              "Messages",
            ].map((item, index) => (
              <button
                key={item}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm ${
                  index === 0
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-950 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-10">
            <div className="mb-3 flex items-center justify-between px-3">
              <p className="text-[10px] uppercase tracking-widest text-zinc-700">
                Projects
              </p>

              <button
                onClick={() =>
                  setShowProjectModal(true)
                }
                className="text-lg leading-none text-zinc-600 hover:text-white"
              >
                +
              </button>
            </div>

            <div className="space-y-1">
              {projects.length === 0 ? (
                <p className="px-3 text-xs text-zinc-700">
                  No projects yet
                </p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project._id}
                    onClick={() =>
                      openWorkspace(project._id)
                    }
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                      selectedProject === project._id
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-500 hover:bg-zinc-950 hover:text-white"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />

                    <span className="truncate">
                      {project.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* MAIN */}

        <section className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs text-zinc-600">
                  Saturday, August 15, 2026
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Good evening, Sambodh.
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  Here&apos;s what&apos;s happening with your team.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setShowProjectModal(true)
                  }
                  className="rounded-lg border border-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
                >
                  + New project
                </button>

                {selectedProject && (
                  <button
                    onClick={() =>
                      openWorkspace(selectedProject)
                    }
                    className="rounded-lg border border-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
                  >
                    Open Workspace →
                  </button>
                )}

                <button
                  onClick={() =>
                    setShowTaskModal(true)
                  }
                  disabled={!selectedProject}
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + New task
                </button>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-6 flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
                <span>{error}</span>

                <button
                  onClick={() => setError("")}
                  className="text-lg text-red-700 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            )}

            {/* PROJECT SELECTOR */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="text-xs text-zinc-600">
                Current project
              </span>

              <select
                value={selectedProject}
                onChange={(e) =>
                  setSelectedProject(e.target.value)
                }
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600"
              >
                {projects.length === 0 ? (
                  <option value="">
                    No projects
                  </option>
                ) : (
                  projects.map((project) => (
                    <option
                      key={project._id}
                      value={project._id}
                    >
                      {project.name}
                    </option>
                  ))
                )}
              </select>

              {selectedProject && (
                <>
                  <button
                    onClick={() =>
                      openWorkspace(selectedProject)
                    }
                    className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black hover:bg-zinc-200"
                  >
                    Open Workspace →
                  </button>

                  <button
                    onClick={deleteProject}
                    disabled={deletingProject}
                    className="rounded-lg border border-red-900/60 px-3 py-2 text-xs text-red-500 transition hover:border-red-700 hover:bg-red-950/30 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingProject
                      ? "Deleting..."
                      : "Delete project"}
                  </button>
                </>
              )}
            </div>

            {/* STATS */}

            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5">
                <p className="text-xs text-zinc-600">
                  Active projects
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {projects.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5">
                <p className="text-xs text-zinc-600">
                  Open tasks
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {tasks.length - done.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5">
                <p className="text-xs text-zinc-600">
                  Completed
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {done.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5">
                <p className="text-xs text-zinc-600">
                  Team members
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  1
                </p>
              </div>
            </div>

            {/* TASK BOARD */}

            <div className="mt-10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {currentProject
                      ? `${currentProject.name} tasks`
                      : "Current sprint"}
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Move tasks between stages as work progresses.
                  </p>
                </div>

                <span className="text-xs text-zinc-600">
                  {tasks.length} tasks
                </span>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950/50 py-16 text-center text-sm text-zinc-600">
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
                  <p className="text-sm text-zinc-400">
                    No projects yet
                  </p>

                  <p className="mt-2 text-xs text-zinc-700">
                    Create a project before adding tasks.
                  </p>

                  <button
                    onClick={() =>
                      setShowProjectModal(true)
                    }
                    className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
                  >
                    Create your first project
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-3">
                  <Column
                    title="Todo"
                    items={todo}
                    dot="bg-zinc-500"
                  />

                  <Column
                    title="In Progress"
                    items={progress}
                    dot="bg-yellow-500"
                  />

                  <Column
                    title="Done"
                    items={done}
                    dot="bg-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* ACTIVITY */}

            <div className="mt-10 rounded-2xl border border-zinc-900 bg-zinc-950/50 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Recent activity
                </h2>

                <span className="text-xs text-zinc-700">
                  Live
                </span>
              </div>

              <div className="mt-6">
                {tasks.length === 0 ? (
                  <p className="text-sm text-zinc-700">
                    No recent activity.
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">
                    {tasks.length} task
                    {tasks.length === 1 ? "" : "s"} currently in this project.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PROJECT MODAL */}

      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Create new project
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Set up a workspace for your project.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowProjectModal(false)
                }
                className="text-xl text-zinc-600 hover:text-white"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateProject}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-2 block text-xs text-zinc-500">
                  Project name
                </label>

                <input
                  value={projectName}
                  onChange={(e) =>
                    setProjectName(e.target.value)
                  }
                  placeholder="e.g. DevSync"
                  required
                  className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-zinc-500">
                  Description
                </label>

                <textarea
                  value={projectDescription}
                  onChange={(e) =>
                    setProjectDescription(e.target.value)
                  }
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectModal(false);
                    setProjectName("");
                    setProjectDescription("");
                  }}
                  className="flex-1 rounded-lg border border-zinc-800 py-3 text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingProject}
                  className="flex-1 rounded-lg bg-white py-3 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  {creatingProject
                    ? "Creating..."
                    : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Create new task
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  {currentProject?.name}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowTaskModal(false)
                }
                className="text-xl text-zinc-600 hover:text-white"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateTask}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-2 block text-xs text-zinc-500">
                  Task title
                </label>

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="e.g. Build landing page"
                  required
                  className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-zinc-500">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="What needs to be done?"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs text-zinc-500">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(
                        e.target.value as
                          | "low"
                          | "medium"
                          | "high"
                      )
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-3 text-sm text-zinc-300 outline-none focus:border-zinc-600"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-zinc-500">
                    Assignee
                  </label>

                  <input
                    value={assignee}
                    onChange={(e) =>
                      setAssignee(e.target.value)
                    }
                    placeholder="Name"
                    className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowTaskModal(false)
                  }
                  className="flex-1 rounded-lg border border-zinc-800 py-3 text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-white py-3 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}