'use client';

import { useState, useEffect } from "react";
import { Users, TrendingUp, AlertTriangle, MapPin, ArrowUpRight, Search, Bell, Sun, Moon, Menu } from "lucide-react";
import DealerSidebar from "./DealerSidebar";
import DealerChat from "./DealerChat";
import DealerSettings from "./DealerSettings";
import DealerInventoryView from "./DealerInventoryView";
import RaiseInvoiceView from "./RaiseInvoiceView";
import DealerOrdersView from "./DealerOrdersView";

import { Toaster } from 'sonner';
import { getDealerRequests } from "@/actions/requests";

export default function DealerDashboard({ user, inventory, vendors }: { user: any, inventory: any[], vendors: any[] }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    // Check system preference or localStorage
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Fetch Requests
    async function loadRequests() {
      try {
        const data = await getDealerRequests();
        setRequests(data);
      } catch (e) {
        console.error("Failed to load requests", e);
      }
    }
    loadRequests();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <DealerSidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 w-full">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4 md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-xl text-slate-900 dark:text-white">InventoryAI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search vendors, products..." 
                className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-slate-800 rounded-lg"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name || user.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">Dealer</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium">Active Vendors</h3>
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">48</p>
                  <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" /> +3 this week
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium">Purchase Volume</h3>
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">₹2.4M</p>
                  <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" /> +12% vs last month
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium">Credit Used</h3>
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">75%</p>
                  <p className="text-sm text-orange-500 mt-2">Approaching limit with Vendor A</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vendor Leaderboard */}
                <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Orders</h2>
                    <button onClick={() => setActiveTab('orders')} className="text-sm text-blue-500 hover:text-blue-400">View All</button>
                  </div>
                   {requests.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {requests.slice(0, 5).map((req) => (
                          <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center font-bold text-purple-600 dark:text-purple-400">
                                {req.vendor_name?.charAt(0) || 'V'}
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">{req.vendor_name || 'Vendor'}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Order #{req.id.slice(0, 6)} • {req.status}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900 dark:text-white">{req.total_items} Items</p>
                              <p className="text-xs text-slate-500">{req.date.split(',')[0]}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500">No recent orders</div>
                    )}
                </div>

                {/* AI Insights */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <MapPin className="w-5 h-5 text-purple-500" />
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Regional Demand AI</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 shrink-0" />
                          <div>
                            <p className="text-slate-900 dark:text-white font-medium">Surge in Andheri East</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              Demand for <strong>Ready-to-Eat</strong> meals is up 20%. Consider ordering from <span className="text-purple-600 dark:text-purple-400 cursor-pointer">Metro Cash & Carry</span>.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <p className="text-slate-900 dark:text-white font-medium">Price Drop Alert</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              <strong>Rice (Basmati)</strong> prices have dropped by 5% at <span className="text-blue-600 dark:text-blue-400 cursor-pointer">Reliance Market</span>.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <DealerChat user={user} vendors={vendors} />
          )}

          {activeTab === 'settings' && (
            <DealerSettings user={user} />
          )}

          {activeTab === 'inventory' && (
             <DealerInventoryView inventory={inventory} />
          )}

          {activeTab === 'invoice' && (
             <RaiseInvoiceView inventory={inventory} vendors={vendors} />
          )}
          
          {activeTab === 'orders' && (
            <DealerOrdersView requests={requests} />
          )}

        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
