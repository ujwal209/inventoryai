'use client';

import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  TrendingUp, 
  Settings, 
  LogOut,
  ScanLine,
  MessageSquare,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function VendorSidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-blue-500">
          <ScanLine className="w-8 h-8" />
          <span className="font-bold text-xl text-white">InventoryAI</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Vendor Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === item.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
          <p className="text-xs text-slate-400 mb-2">Storage Used</p>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="w-[75%] h-full bg-blue-500 rounded-full" />
          </div>
          <p className="text-xs text-right text-slate-400 mt-1">75%</p>
        </div>
      </div>
    </div>
  );
}
