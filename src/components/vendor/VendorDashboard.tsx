'use client';

import { useState, useEffect } from "react";
import { Package, TrendingUp, AlertCircle, Plus, ScanLine, Search, Bell, Sun, Moon, Menu } from "lucide-react";
import InvoiceUploader from "./InvoiceUploader";
import VendorSidebar from "./Sidebar";
import InvoiceList from "./InvoiceList";
import { getVendorInvoices, getVendorStats, getVendorInventory, getDealersForVendor } from "@/actions/vendor";
import { getVendorRequests } from "@/actions/requests";
import SignOutButton from "@/components/auth/SignOutButton";
import InventoryView from "./InventoryView";
import SettingsView from "./SettingsView";
import VendorChat from "./VendorChat";
import OrderManager from "./OrderManager";
import AnalyticsView from "./AnalyticsView";
import NetworkView from "./NetworkView";

import NotificationBell from "@/components/common/NotificationBell";
import { Toaster } from 'sonner';

export default function VendorDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]); // New state for dealers/customers
  const [stats, setStats] = useState<any>({ todayProfit: 0, totalSales: 0, pendingInvoices: 0 });
  const [activeChatDealer, setActiveChatDealer] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleStartChat = (dealer: any) => {
    setActiveChatDealer(dealer);
    setActiveTab('chat');
  };

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
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesData, statsData, inventoryData, requestsData, dealersData] = await Promise.all([
          getVendorInvoices(),
          getVendorStats(),
          getVendorInventory(),
          getVendorRequests(),
          getDealersForVendor()
        ]);
        setInvoices(invoicesData);
        if (statsData) setStats(statsData);
        if (inventoryData) setInventory(inventoryData);
        if (requestsData) setRequests(requestsData);
        if (dealersData) setDealers(dealersData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

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
        <VendorSidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} />
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
                placeholder="Search invoices, inventory, or reports..." 
                className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
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
            <NotificationBell />
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.business_details?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                <div className="flex gap-3">
                  <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> New Sale
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 relative overflow-hidden group shadow-sm dark:shadow-none hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-24 h-24 text-green-500" />
                  </div>
                  <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Today's Profit</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{stats.todayProfit.toLocaleString()}</p>
                  <p className="text-sm text-green-500 mt-2">
                    (Sales - AI Cost)
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none hover:shadow-md transition-all">
                  <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Sales</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{stats.totalSales.toLocaleString()}</p>
                  <p className="text-sm text-green-500 mt-2">+5% from yesterday</p>
                </div>

                <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none hover:shadow-md transition-all">
                  <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Pending Invoices</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pendingInvoices}</p>
                  <p className="text-sm text-yellow-500 mt-2">Processing...</p>
                </div>
              </div>

              {/* Upload Section */}
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Upload</h2>
                  <InvoiceUploader />
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
                  <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">AI Recommendations</p>
                    <div className="mt-4 space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                        <p className="text-slate-900 dark:text-white font-medium">Stock Alert</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          You have <strong>2 days</strong> of Rice left. Consider restocking soon.
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg">
                        <p className="text-slate-900 dark:text-white font-medium">Optimization</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
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
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoice History</h1>
                <InvoiceUploader /> 
              </div>
              <InvoiceList invoices={invoices} />
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
                <button className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
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
            <VendorChat user={user} dealers={dealers} initialChatDealer={activeChatDealer} />
          )}

          {activeTab === 'orders' && (
            <OrderManager user={user} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView inventory={inventory} />
          )}

          {activeTab === 'network' && (
             <NetworkView requests={requests} dealers={dealers} onChat={handleStartChat} />
          )}

        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
