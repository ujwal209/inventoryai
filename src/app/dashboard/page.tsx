import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import DealerDashboard from "@/components/dealer/DealerDashboard";
import VendorDashboard from "@/components/vendor/VendorDashboard";
import CustomerDashboard from "@/components/customer/CustomerDashboard";
import { getVendorInventory } from "@/actions/vendor";
import { getVendorsForDealer } from "@/actions/dealer";

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
    const inventory = await getVendorInventory();
    const vendors = await getVendorsForDealer();
    return <DealerDashboard user={user} inventory={inventory} vendors={vendors} />;
  }

  if (user.role === "customer") {
    return <CustomerDashboard user={user} />;
  }

  // Vendor Dashboard (Self-contained layout)
  return <VendorDashboard user={user} />;
}
