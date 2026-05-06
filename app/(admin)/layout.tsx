import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/games", label: "Games" },
  { href: "/help", label: "Help" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      <aside className="w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="text-white font-semibold text-sm">Boardly</div>
          <div className="text-zinc-500 text-xs mt-0.5">Control Panel</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-zinc-800">
          <div className="text-zinc-500 text-xs truncate mb-2">{session.user?.email}</div>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
