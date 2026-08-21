import { getAdminSession } from "@/lib/auth/admin";
import { AdminNavbar } from "@/components/layout/admin-navbar";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <PullToRefresh>
      <div className="min-h-screen bg-slate-50">
        <AdminNavbar adminName={session.name} />
        <div className="lg:pl-64">
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
        </div>
      </div>
    </PullToRefresh>
  );
}
