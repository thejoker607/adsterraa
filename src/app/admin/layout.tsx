import { getAdminSession } from "@/lib/auth/admin";
import { AdminNavbar } from "@/components/layout/admin-navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return (
    <div className="min-h-screen bg-slate-950">
      {session && <AdminNavbar adminName={session.name} />}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
