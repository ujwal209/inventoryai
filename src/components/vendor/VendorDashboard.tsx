'use client';

import { useState, useEffect } from "react";
import { Package, TrendingUp, AlertCircle, Plus, ScanLine, Search, Bell } from "lucide-react";
import InvoiceUploader from "./InvoiceUploader";
import VendorSidebar from "./Sidebar";
import InvoiceList from "./InvoiceList";
import { getVendorInvoices, getVendorStats, getVendorInventory } from "@/actions/vendor";
import SignOutButton from "@/components/auth/SignOutButton";
import InventoryView from "./InventoryView";
import SettingsView from "./SettingsView";
import VendorChat from "./VendorChat";
import OrderManager from "./OrderManager";

export default function VendorDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ todayProfit: 0, totalSales: 0, pendingInvoices: 0 });
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesData, statsData, inventoryData] = await Promise.all([
          getVendorInvoices(),
          getVendorStats(),
          getVendorInventory()
        ]);
        setInvoices(invoicesData);
        if (statsData) setStats(statsData);
        if (inventoryData) setInventory(inventoryData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <VendorSidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-xl text-white">InventoryAI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search invoices, inventory, or reports..." 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.business_details?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Sale
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-24 h-24 text-green-500" />
                  </div>
                  <h3 className="text-slate-400 font-medium mb-1">Today's Profit</h3>
                  <p className="text-3xl font-bold text-white">₹{stats.todayProfit.toLocaleString()}</p>
                  <p className="text-sm text-green-500 mt-2">
                    (Sales - AI Cost)
                  </p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-slate-400 font-medium mb-1">Total Sales</h3>
                  <p className="text-3xl font-bold text-white">₹{stats.totalSales.toLocaleString()}</p>
                  <p className="text-sm text-green-500 mt-2">+5% from yesterday</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-slate-400 font-medium mb-1">Pending Invoices</h3>
                  <p className="text-3xl font-bold text-white">{stats.pendingInvoices}</p>
                  <p className="text-sm text-yellow-500 mt-2">Processing...</p>
                </div>
              </div>

              {/* Upload Section */}
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Quick Upload</h2>
                  <InvoiceUploader />
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <p className="text-slate-400 text-sm">AI Recommendations</p>
                    <div className="mt-4 space-y-4">
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-white font-medium">Stock Alert</p>
                        <p className="text-sm text-slate-400 mt-1">
                          You have <strong>2 days</strong> of Rice left. Consider restocking soon.
                        </p>
                      </div>
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <p className="text-white font-medium">Optimization</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Stop buying <strong>Brand X</strong>; it sits on the shelf for 20 days. Buy Brand Y instead.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Invoice History</h1>
                <InvoiceUploader /> 
              </div>
              <InvoiceList invoices={invoices} />
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Package className="w-4 h-4" /> Export Report
                </button>
              </div>
              <InventoryView inventory={inventory} />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsView user={user} />
          )}

          {activeTab === 'chat' && (
            <VendorChat user={user} />
          )}

          {activeTab === 'orders' && (
            <OrderManager user={user} />
          )}

          {/* Placeholders for other tabs */}
          {['analytics'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
              <Package className="w-16 h-16 mb-4 opacity-20" />
              <h2 className="text-xl font-medium text-white mb-2">Coming Soon</h2>
              <p>The {activeTab} module is currently under development.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
