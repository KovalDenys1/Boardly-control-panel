import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";
import { MatrixRain } from "@/app/components/MatrixRain";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="bk-root">
      <MatrixRain />
      <div className="bk-scanlines" aria-hidden="true" />
      <div className="bk-shell">
        <Sidebar email={session.user?.email ?? ""} />
        <main className="bk-main">{children}</main>
      </div>
    </div>
  );
}
