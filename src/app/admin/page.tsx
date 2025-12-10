import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { approveUser, rejectUser } from "@/actions/admin";
import { Check, X, Shield, Users, Store, Truck, LogOut } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";

async function getUsers(status: string, role?: string) {
  const admin = await initAdmin();
  if (!admin) return [];

  const db = getFirestore(admin);
  let query = db.collection("users").where("status", "==", status);
  
  if (role) {
    query = query.where("role", "==", role);
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
}

export default async function AdminDashboard() {
  const user = await getUserProfile();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const pendingUsers = await getUsers("pending");
  const vendors = await getUsers("approved", "vendor");
  const dealers = await getUsers("approved", "dealer");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Portal</h1>
              <p className="text-slate-400">Overview and Access Control</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 text-sm text-slate-400">
              {user.email}
            </div>
            <SignOutButton />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-medium">Pending Requests</h3>
              <Users className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold">{pendingUsers.length}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-medium">Active Vendors</h3>
              <Store className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{vendors.length}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-medium">Active Dealers</h3>
              <Truck className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold">{dealers.length}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Pending Section */}
          <section className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <h2 className="text-xl font-semibold">Pending Approvals</h2>
            </div>
            
            {pendingUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                All caught up! No pending requests.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-900/20 transition-colors">
                    <div>
                      <h3 className="font-medium text-lg text-white">{u.business_details?.name}</h3>
                      <div className="text-sm text-slate-400 mt-1 space-y-1">
                        <p className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${u.role === 'vendor' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {u.role}
                          </span>
                          <span>{u.email}</span>
                        </p>
                        <p>{u.business_details?.phone} • {u.business_details?.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <form action={rejectUser.bind(null, u.id)}>
                        <button className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" title="Reject">
                          <X className="w-5 h-5" />
                        </button>
                      </form>
                      <form action={approveUser.bind(null, u.id)}>
                        <button className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors" title="Approve">
                          <Check className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Approved Users Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Vendors List */}
            <section className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h2 className="text-xl font-semibold">Vendors</h2>
              </div>
              <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
                {vendors.map((u) => (
                  <div key={u.id} className="p-4 hover:bg-slate-900/20 transition-colors">
                    <h3 className="font-medium text-white">{u.business_details?.name}</h3>
                    <p className="text-sm text-slate-400">{u.business_details?.address}</p>
                  </div>
                ))}
                {vendors.length === 0 && <div className="p-8 text-center text-slate-500">No active vendors</div>}
              </div>
            </section>

            {/* Dealers List */}
            <section className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <h2 className="text-xl font-semibold">Dealers</h2>
              </div>
              <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
                {dealers.map((u) => (
                  <div key={u.id} className="p-4 hover:bg-slate-900/20 transition-colors">
                    <h3 className="font-medium text-white">{u.business_details?.name}</h3>
                    <p className="text-sm text-slate-400">{u.business_details?.address}</p>
                  </div>
                ))}
                {dealers.length === 0 && <div className="p-8 text-center text-slate-500">No active dealers</div>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
