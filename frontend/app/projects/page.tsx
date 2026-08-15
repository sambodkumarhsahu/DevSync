"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  _id: string;
  name: string;
  description?: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("devsync_token");

        if (!token) {
          setError("Please login first.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/projects",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load projects");
        }

        setProjects(data.projects || []);
      } catch (error) {
        console.error("Failed to fetch projects:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] p-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Projects
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Select a project to open its workspace.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            ← Dashboard
          </Link>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="rounded-xl border border-zinc-800 bg-[#0b0b0b] p-8 text-center">
            <p className="text-sm text-zinc-500">
              Loading projects...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && projects.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-[#0b0b0b] p-10 text-center">
            <h2 className="text-lg font-semibold">
              No projects yet
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Create your first project from the dashboard.
            </p>

            <Link
              href="/dashboard"
              className="mt-5 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-zinc-200"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* PROJECTS */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#0b0b0b] p-5 transition hover:border-zinc-700"
              >
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">
                    {project.name}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {project.description || "No description"}
                  </p>
                </div>

                {/* THIS OPENS WORKSPACE */}
                <Link
                  href={`/workspace/${project._id}`}
                  className="ml-6 shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                >
                  Open Workspace →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}