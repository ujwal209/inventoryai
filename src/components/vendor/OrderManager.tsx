'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  Truck, 
  MapPin, 
  ChevronDown, 
  ChevronUp,
  ShoppingBag,
  User,
  Phone,
  LayoutGrid,
  List as ListIcon,
  CheckSquare,
  FileText,
  Search,
  Calendar,
  Filter,
  RefreshCcw,
  Volume2,
  VolumeX,
  Printer
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

// Sound for new orders
const NEW_ORDER_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

interface OrderManagerProps {
  user: any;
}

export default function OrderManager({ user }: OrderManagerProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  // Real-time listener
  useEffect(() => {
    if (!user?.uid) return;

    // Note: If 'createdAt' sorting causes index errors, remove orderBy and sort in JS
    const q = query(
      collection(db, "orders"), 
      where("vendorId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort in memory to avoid index issues
      ordersData.sort((a: any, b: any) => b.createdAt - a.createdAt);

      setOrders(ordersData);
      setLoading(false);

      // Play sound if new order arrived (checking count increase)
      if (ordersData.length > lastOrderCount && lastOrderCount !== 0) {
        if (soundEnabled) {
          const audio = new Audio(NEW_ORDER_SOUND);
          audio.play().catch(e => console.log('Audio play failed', e));
        }
        toast.success("New Order Received!");
      }
      setLastOrderCount(ordersData.length);
    }, (error) => {
      console.error("Error fetching orders:", error);
      toast.error("Live updates disconnected. Please refresh.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, soundEnabled]); // omitting lastOrderCount to avoid loops, handled by closure/ref mechanism usually better but simple logic here

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      // Optimistic update handled by Firestore listener technically, 
      // but for instant feedback we rely on the listener being fast.
      // We update direct via Client SDK
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().getTime()
      });
      
      toast.success(`Order marked as ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Failed to update status");
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Tab Filter
    if (activeTab === 'pending') result = result.filter(o => o.status === 'pending');
    else if (activeTab === 'active') result = result.filter(o => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status));
    else if (activeTab === 'history') result = result.filter(o => ['completed', 'rejected', 'cancelled'].includes(o.status));

    // Search Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(lower) || 
        o.customerName?.toLowerCase().includes(lower) ||
        o.items?.some((i: any) => i.name.toLowerCase().includes(lower))
      );
    }

    return result;
  }, [orders, activeTab, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      revenue: orders.filter(o => o.status === 'completed').reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0),
      today: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length
    };
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20';
      case 'accepted': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'preparing': return 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20';
      case 'ready': return 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20';
      case 'out_for_delivery': return 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20';
      case 'completed': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
      case 'rejected': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
      default: return 'text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20';
    }
  };

  const pipelineColumns = [
    { id: 'pending', label: 'Pending', status: 'pending', color: 'border-yellow-400' },
    { id: 'preparing', label: 'Processing', status: 'preparing', color: 'border-orange-400' },
    { id: 'ready', label: 'Ready', status: 'ready', color: 'border-purple-400' },
    { id: 'dispatch', label: 'Dispatch', status: 'out_for_delivery', color: 'border-indigo-400' },
  ];

  if (loading) { // Initial loading only
    return (
       <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 animate-pulse">Syncing orders...</p>
       </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Total Income</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats.revenue.toLocaleString()}</h3>
           </div>
           <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Pending</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</h3>
           </div>
           <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400">
              <Clock className="w-5 h-5" />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Today's Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.today}</h3>
           </div>
           <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-5 h-5" />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</h3>
           </div>
           <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Package className="w-5 h-5" />
           </div>
        </div>
      </div>

      {/* Controls: Search, View Mode, Sound */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
         <div className="flex items-center gap-2 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search order ID, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
             </div>
             <button
               onClick={() => setSoundEnabled(!soundEnabled)}
               className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-400 bg-gray-100 dark:bg-slate-800'}`}
               title={soundEnabled ? "Sound On" : "Sound Muted"}
             >
               {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
             </button>
         </div>

         <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
               {['pending', 'active', 'history'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
               <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}>
                 <ListIcon className="w-4 h-4" />
               </button>
               <button onClick={() => setViewMode('pipeline')} className={`p-1.5 rounded-md ${viewMode === 'pipeline' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}>
                 <LayoutGrid className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode='wait'>
         {filteredOrders.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
             className="flex flex-col items-center justify-center py-20 text-slate-400"
           >
             <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
             <p className="text-lg font-medium">No orders found</p>
             <p className="text-sm">Waiting for new requests...</p>
           </motion.div>
         ) : viewMode === 'list' ? (
           <div className="grid gap-4">
             {filteredOrders.map((order) => (
                <motion.div 
                  key={order.id}
                  layoutId={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
                     <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                 {order.status.replace('_', ' ')}
                              </span>
                              <span className="text-sm text-slate-500 font-mono">#{order.id.slice(-6)}</span>
                           </div>
                           <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleString()}
                           </span>
                        </div>

                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                             <User className="w-6 h-6 text-slate-500" />
                           </div>
                           <div>
                              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{order.customerName}</h4>
                              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                 <Phone className="w-3 h-3" /> {order.contact || 'No Contact'} 
                                 <span className="text-slate-300">|</span> 
                                 <MapPin className="w-3 h-3" /> {order.deliveryAddress ? order.deliveryAddress.substring(0, 30) : 'Pickup/N/A'}...
                              </p>
                           </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
                           <p className="text-xs font-bold text-slate-500 uppercase mb-2">Order Items</p>
                           <ul className="space-y-1">
                             {order.items.map((item: any, idx: number) => (
                               <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex justify-between">
                                  <span><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                                  <span className="text-slate-400">₹{(Number(item.price) * Number(item.quantity)).toLocaleString()}</span>
                               </li>
                             ))}
                           </ul>
                           <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
                              <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{order.totalAmount.toLocaleString()}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-2 min-w-[180px] justify-center sm:border-l sm:border-gray-100 sm:dark:border-slate-800 sm:pl-6">
                        {order.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusUpdate(order.id, 'accepted')} className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm">
                              <CheckCircle className="w-4 h-4" /> Accept Order
                            </button>
                            <button onClick={() => handleStatusUpdate(order.id, 'rejected')} className="w-full py-2.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-bold text-sm transition-colors">
                              Reject
                            </button>
                          </>
                        )}
                        {order.status === 'accepted' && (
                           <button onClick={() => handleStatusUpdate(order.id, 'preparing')} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                              <Package className="w-4 h-4" /> Start Preparing
                           </button>
                        )}
                        {order.status === 'preparing' && (
                           <button onClick={() => handleStatusUpdate(order.id, 'ready')} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                              <CheckSquare className="w-4 h-4" /> Mark Ready
                           </button>
                        )}
                        {order.status === 'ready' && (
                           <button onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                              <Truck className="w-4 h-4" /> Dispatch Driver
                           </button>
                        )}
                        {order.status === 'out_for_delivery' && (
                           <button onClick={() => handleStatusUpdate(order.id, 'completed')} className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                              <CheckCircle className="w-4 h-4" /> Complete Delivery
                           </button>
                        )}
                        {order.status === 'completed' && (
                           <button onClick={() => window.print()} className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                              <Printer className="w-4 h-4" /> Print Invoice
                           </button>
                        )}
                     </div>
                  </div>
                </motion.div>
             ))}
           </div>
         ) : (
           <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 min-h-[600px]">
             {pipelineColumns.map(column => (
               <div key={column.id} className="min-w-[320px] w-[320px] flex-shrink-0 flex flex-col gap-4">
                  <div className={`p-4 rounded-xl border-t-4 ${column.color} bg-white dark:bg-slate-900 shadow-sm border-x border-b border-gray-200 dark:border-slate-800`}>
                     <h3 className="font-bold text-slate-900 dark:text-white flex justify-between items-center text-sm uppercase tracking-wider">
                       {column.label}
                       <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 font-bold">
                         {filteredOrders.filter(o => o.status === column.status).length}
                       </span>
                     </h3>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    {filteredOrders.filter(o => o.status === column.status || (column.id === 'pending' && o.status === 'accepted')).map(order => (
                      <motion.div 
                        key={order.id}
                        layoutId={order.id}
                        className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:border-blue-500 dark:hover:border-blue-500 transition-colors group cursor-pointer relative"
                      >
                         <div className="flex justify-between items-start mb-3">
                           <span className="text-xs font-mono text-slate-400">#{order.id.slice(-4)}</span>
                           <span className="text-sm font-bold text-slate-900 dark:text-white">₹{order.totalAmount}</span>
                         </div>
                         <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{order.customerName}</h4>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                            {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                         </p>
                         
                         {/* Quick Action Button */}
                         <div>
                            {order.status === 'pending' && (
                               <button onClick={() => handleStatusUpdate(order.id, 'accepted')} className="w-full py-2 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-500/20">Accept</button>
                            )}
                            {order.status === 'accepted' && (
                               <button onClick={() => handleStatusUpdate(order.id, 'preparing')} className="w-full py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20">Prepare</button>
                            )}
                            {order.status === 'preparing' && (
                               <button onClick={() => handleStatusUpdate(order.id, 'ready')} className="w-full py-2 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-500/20">Ready</button>
                            )}
                            {order.status === 'ready' && (
                               <button onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')} className="w-full py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20">Dispatch</button>
                            )}
                            {order.status === 'out_for_delivery' && (
                               <button onClick={() => handleStatusUpdate(order.id, 'completed')} className="w-full py-2 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-500/20">Complete</button>
                            )}
                         </div>
                      </motion.div>
                    ))}
                  </div>
               </div>
             ))}
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
