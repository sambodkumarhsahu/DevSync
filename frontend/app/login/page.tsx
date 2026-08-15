"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }

      localStorage.setItem("devsync_token", data.token);
      localStorage.setItem(
        "devsync_user",
        JSON.stringify(data.user)
      );

      router.push("/dashboard");
    } catch {
      setError("Could not connect to the DevSync server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <a
            href="/"
            className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-black"
          >
            D
          </a>

          <h1 className="text-2xl font-semibold">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Sign in to your DevSync workspace.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6"
        >
          {error && (
            <div className="mb-5 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-zinc-500"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm text-zinc-400">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-zinc-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-5 text-center text-sm text-zinc-600">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-zinc-300 hover:text-white"
            >
              Create one
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
