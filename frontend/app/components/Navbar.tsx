"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">
            D
          </div>

          <span className="text-sm font-semibold tracking-tight">
            DevSync
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 text-sm text-zinc-500 md:flex">
          <Link
            href="#features"
            className="transition hover:text-white"
          >
            Features
          </Link>

          <Link
            href="#collaboration"
            className="transition hover:text-white"
          >
            Collaboration
          </Link>

          <Link
            href="#pricing"
            className="transition hover:text-white"
          >
            Pricing
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-lg px-4 py-2 text-sm text-zinc-400 transition hover:text-white sm:block"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}