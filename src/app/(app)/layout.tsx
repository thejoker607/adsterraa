import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth/user";
import { AppNavbar } from "@/components/layout/app-navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  if (profile.account_status === "blocked") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center max-w-md">
          <h1 className="text-lg font-semibold text-red-800">Account Blocked</h1>
          <p className="mt-2 text-sm text-red-600">
            Your account has been blocked. Contact support for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (profile.account_status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center max-w-md">
          <h1 className="text-lg font-semibold text-amber-800">Pending Approval</h1>
          <p className="mt-2 text-sm text-amber-700">
            Your registration is awaiting admin approval. You&apos;ll be able to access the platform once approved.
          </p>
        </div>
      </div>
    );
  }

  if (profile.account_status === "rejected") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center max-w-md">
          <h1 className="text-lg font-semibold text-red-800">Registration Rejected</h1>
          <p className="mt-2 text-sm text-red-600">
            Your registration was not approved. Contact support if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNavbar coinBalance={profile.coin_balance} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
