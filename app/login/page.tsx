"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials or insufficient permissions.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mb-1">Boardly</p>
          <h1 className="text-white text-2xl font-semibold">Control Panel</h1>
          <p className="text-zinc-500 text-sm mt-2">Admin access only</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-zinc-400 text-sm mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="admin@boardly.online"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-zinc-400 text-sm mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-zinc-950 font-medium rounded-lg py-2.5 text-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
