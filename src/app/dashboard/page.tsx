import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import DealerDashboard from "@/components/dealer/DealerDashboard";
import VendorDashboard from "@/components/vendor/VendorDashboard";
import CustomerDashboard from "@/components/customer/CustomerDashboard";

export default async function DashboardPage() {
  const user = await getUserProfile();

  if (!user) {
    redirect("/");
  }

  if (user.role === "admin") {
    redirect("/admin");
  }

  if (user.status !== "approved") {
    redirect("/pending-approval");
  }

  if (user.role === "dealer") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">InventoryAI</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-sm text-slate-300 capitalize">
                  {user.role}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DealerDashboard user={user} />
        </main>
      </div>
    );
  }

  if (user.role === "customer") {
    return <CustomerDashboard user={user} />;
  }

  // Vendor Dashboard (Self-contained layout)
  return <VendorDashboard user={user} />;
}
