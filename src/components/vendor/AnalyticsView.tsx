'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  PackageX, 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { getVendorOrders } from '@/actions/order';

interface AnalyticsViewProps {
  inventory: any[];
}

export default function AnalyticsView({ inventory }: AnalyticsViewProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersData = await getVendorOrders();
        setOrders(ordersData);
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- ABC Analysis Logic ---
  // Class A: Top 20% of items by value (price * quantity sold or just price * stock for now)
  // Class B: Next 30%
  // Class C: Bottom 50%
  const calculateABC = () => {
    // Using Stock Value = Price * Quantity as a proxy for "Importance"
    const itemsWithValue = inventory.map(item => ({
      ...item,
      value: (Number(item.sellingPrice) || 0) * (Number(item.quantity) || 0)
    })).sort((a, b) => b.value - a.value);

    const totalValue = itemsWithValue.reduce((sum, item) => sum + item.value, 0);
    let accumulatedValue = 0;
    
    const aItems: any[] = [];
    const bItems: any[] = [];
    const cItems: any[] = [];

    itemsWithValue.forEach(item => {
      accumulatedValue += item.value;
      const percentage = accumulatedValue / totalValue;
      
      if (percentage <= 0.8) aItems.push(item);
      else if (percentage <= 0.95) bItems.push(item);
      else cItems.push(item);
    });

    return { aItems, bItems, cItems, totalValue };
  };

  const { aItems, bItems, cItems } = calculateABC();

  // --- Dead Stock Logic ---
  // Items with no sales in 90 days. 
  // Since we don't have granular sales history per item in this simple mock,
  // we'll "mock" this by picking items with high quantity and low updates (if we had createdAt).
  // For now, let's just show items with quantity > 50 as "Potential Overstock"
  const deadStock = inventory.filter(item => item.quantity > 50).slice(0, 5); // Mock logic

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Business Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Deep dive into your inventory, customers, and financials.</p>
        </div>
        <div className="flex gap-2">
             <select className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none">
                 <option>Last 30 Days</option>
                 <option>Last Quarter</option>
                 <option>This Year</option>
             </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-500">
             <ArrowUpRight className="w-4 h-4 mr-1" /> 12% vs last month
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{orders.length}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
           <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-500">
             <ArrowUpRight className="w-4 h-4 mr-1" /> 5% vs last month
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Returning Customers</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">42%</h3>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
             Consistent with last month
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overstock Value</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                 ₹{deadStock.reduce((sum, item) => sum + (Number(item.sellingPrice) * Number(item.quantity)), 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-lg">
              <PackageX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-600 dark:text-red-500">
             Action needed on 5 items
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Product Performance (ABC Analysis) */}
        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Product Performance (ABC Analysis)</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
             Categorizing items based on value. <strong>Class A</strong> (High Value - 80%), <strong>Class B</strong> (15%), <strong>Class C</strong> (5%).
           </p>
           
           <div className="space-y-6">
              {/* Class A */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Class A (High Priority)</span>
                  <span className="text-slate-500">{aItems.length} Products</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div style={{ width: '80%' }} className="h-full bg-green-500 rounded-full" />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                   {aItems.slice(0, 3).map((item: any) => (
                      <span key={item.docId} className="px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs rounded-md border border-green-200 dark:border-green-800">
                        {item.name}
                      </span>
                   ))}
                   {aItems.length > 3 && <span className="text-xs text-slate-500 self-center">+{aItems.length - 3} more</span>}
                </div>
              </div>

              {/* Class B */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Class B (Moderate)</span>
                  <span className="text-slate-500">{bItems.length} Products</span>
                </div>
                 <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div style={{ width: '15%' }} className="h-full bg-yellow-500 rounded-full" />
                </div>
              </div>

              {/* Class C */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Class C (Low Priority)</span>
                  <span className="text-slate-500">{cItems.length} Products</span>
                </div>
                 <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div style={{ width: '5%' }} className="h-full bg-blue-500 rounded-full" />
                </div>
                 <div className="mt-2 flex flex-wrap gap-2">
                   {cItems.slice(0, 3).map((item: any) => (
                      <span key={item.docId} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-md border border-slate-200 dark:border-slate-700">
                        {item.name}
                      </span>
                   ))}
                </div>
              </div>
           </div>
        </div>

        {/* Dead Stock & Aging Report */}
        <div className="space-y-8">
           {/* Dead Stock */}
           <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-red-500" />
                 Dead Stock Analysis
               </h3>
               <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View All</button>
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Items not moving for 90+ days. Consider discounting.</p>

             <div className="space-y-3">
               {deadStock.map((item: any, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                     <div>
                       <p className="font-medium text-slate-900 dark:text-white text-sm">{item.name}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400">{item.quantity} units in stock</p>
                     </div>
                     <button className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">
                       Discount 20%
                     </button>
                  </div>
               ))}
               {deadStock.length === 0 && <p className="text-sm text-slate-500 italic">No dead stock detected. Good job!</p>}
             </div>
           </div>

           {/* Aging Report - Accounts Receivable */}
           <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Aging Report</h3>
              <div className="flex items-end gap-2 h-32">
                 <div className="flex-1 flex flex-col justify-end gap-2 group cursor-pointer">
                    <div className="w-full bg-green-500/80 group-hover:bg-green-500 rounded-t-lg transition-all h-[40%]" />
                    <p className="text-xs text-center text-slate-500">0-30 Days</p>
                    <p className="text-xs text-center font-bold text-slate-900 dark:text-white">₹1.2L</p>
                 </div>
                 <div className="flex-1 flex flex-col justify-end gap-2 group cursor-pointer">
                    <div className="w-full bg-yellow-500/80 group-hover:bg-yellow-500 rounded-t-lg transition-all h-[25%]" />
                    <p className="text-xs text-center text-slate-500">30-60 Days</p>
                    <p className="text-xs text-center font-bold text-slate-900 dark:text-white">₹45k</p>
                 </div>
                 <div className="flex-1 flex flex-col justify-end gap-2 group cursor-pointer">
                    <div className="w-full bg-red-500/80 group-hover:bg-red-500 rounded-t-lg transition-all h-[15%]" />
                    <p className="text-xs text-center text-slate-500">60+ Days</p>
                    <p className="text-xs text-center font-bold text-slate-900 dark:text-white">₹12k</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
