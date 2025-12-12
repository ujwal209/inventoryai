'use client';

import { 
  LayoutDashboard, 
  Store, 
  MessageSquare, 
  Settings, 
  LogOut,
  ScanLine,
  Search,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DealerSidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { signOut } = useAuth();
  
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Store },
    { id: 'orders', label: 'Sent Orders', icon: FileText },
    { id: 'invoice', label: 'Raise Invoice', icon: Store },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Profile Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-screen flex flex-col transition-colors duration-300">
      <div className="p-6 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-500">
          <ScanLine className="w-8 h-8" />
          <span className="font-bold text-xl text-slate-900 dark:text-white">InventoryAI</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dealer Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === item.id 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                : "text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-slate-800">
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 mb-4 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>

        <div className="bg-gray-100 dark:bg-slate-800/50 rounded-xl p-4">
           <p className="text-xs text-slate-500 dark:text-slate-400">Account Status</p>
           <p className="text-sm font-bold text-green-500 mt-1 flex items-center gap-1">
             ● Active
           </p>
        </div>
      </div>
    </div>
  );
}
