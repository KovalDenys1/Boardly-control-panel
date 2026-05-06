import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getUsers() {
  return prisma.users.findMany({
    where: { isGuest: false },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      suspended: true,
      createdAt: true,
      lastActiveAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function toggleSuspend(userId: string, suspend: boolean, adminId: string) {
  await prisma.users.update({
    where: { id: userId },
    data: { suspended: suspend },
  });

  await prisma.adminAuditLogs.create({
    data: {
      id: crypto.randomUUID(),
      adminId,
      action: suspend ? "suspend_user" : "unsuspend_user",
      targetType: "user",
      targetId: userId,
      details: { suspended: suspend },
    },
  });
}

export default async function UsersPage() {
  const session = await auth();
  const adminId = session!.user!.id!;
  const users = await getUsers();

  async function handleSuspend(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const action = formData.get("action") as string;
    await toggleSuspend(userId, action === "suspend", adminId);
    revalidatePath("/users");
  }

  const suspended = users.filter((u) => u.suspended).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Users</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {users.length} registered &middot;{" "}
            <span className={suspended > 0 ? "text-red-400" : "text-zinc-500"}>
              {suspended} suspended
            </span>
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-zinc-500 font-medium px-5 py-3">User</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Role</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Joined</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Last active</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="text-white font-medium">{user.username ?? "—"}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">{user.email}</div>
                </td>
                <td className="px-5 py-3.5">
                  {user.role === "admin" ? (
                    <span className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded-full">
                      admin
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-xs">user</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs">
                  {user.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs">
                  {user.lastActiveAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3.5">
                  {user.suspended ? (
                    <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded-full">
                      suspended
                    </span>
                  ) : (
                    <span className="text-xs bg-green-950 text-green-400 border border-green-900 px-2 py-0.5 rounded-full">
                      active
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {user.role !== "admin" && (
                    <form action={handleSuspend}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="action" value={user.suspended ? "unsuspend" : "suspend"} />
                      <button
                        type="submit"
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          user.suspended
                            ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                            : "border-red-900 text-red-400 hover:bg-red-950 hover:border-red-800"
                        }`}
                      >
                        {user.suspended ? "Unsuspend" : "Suspend"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="px-5 py-12 text-center text-zinc-600">No registered users found.</div>
        )}
      </div>
    </div>
  );
}
