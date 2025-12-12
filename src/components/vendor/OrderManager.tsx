'use client';

import { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { getVendorOrders, updateOrderStatus } from '@/actions/order';

interface OrderManagerProps {
  user: any;
}

export default function OrderManager({ user }: OrderManagerProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getVendorOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error("Failed to update status", error);
      fetchOrders(); // Revert on error
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-500/10';
      case 'accepted': return 'text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-500/10';
      case 'preparing': return 'text-orange-600 dark:text-orange-500 bg-orange-100 dark:bg-orange-500/10';
      case 'ready': return 'text-purple-600 dark:text-purple-500 bg-purple-100 dark:bg-purple-500/10';
      case 'out_for_delivery': return 'text-indigo-600 dark:text-indigo-500 bg-indigo-100 dark:bg-indigo-500/10';
      case 'completed': return 'text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-500/10';
      case 'rejected': return 'text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-500/10';
      default: return 'text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Pipeline Columns
  const pipelineColumns = [
    { id: 'pending', label: 'Pending Approval', status: 'pending', color: 'border-yellow-400' },
    { id: 'preparing', label: 'In Kitchen', status: 'preparing', color: 'border-orange-400' },
    { id: 'ready', label: 'Ready for Pickup', status: 'ready', color: 'border-purple-400' },
    { id: 'dispatch', label: 'Out for Delivery', status: 'out_for_delivery', color: 'border-indigo-400' },
  ];

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'active') return ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);
    if (activeTab === 'history') return ['completed', 'rejected', 'cancelled'].includes(order.status);
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Order Management</h1>
          
          <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 w-full sm:w-auto">
             <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                title="List View"
             >
               <ListIcon className="w-5 h-5 mx-auto sm:mx-0" />
             </button>
             <button
                onClick={() => setViewMode('pipeline')}
                className={`flex-1 sm:flex-none p-2 rounded-lg transition-colors ${viewMode === 'pipeline' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                title="Pipeline View (Kanban)"
             >
               <LayoutGrid className="w-5 h-5 mx-auto sm:mx-0" />
             </button>
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
             <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 w-full sm:w-auto overflow-x-auto">
              {['pending', 'active', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                  {tab === 'pending' && orders.filter(o => o.status === 'pending').length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {orders.filter(o => o.status === 'pending').length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 w-full sm:w-auto justify-end">
                 <span className="text-sm text-slate-500 dark:text-slate-400">{selectedOrders.length} selected</span>
                 <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg flex items-center gap-2 hover:bg-blue-500">
                    <FileText className="w-3 h-3" /> Generate Invoice
                 </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEWS */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800">
              <ShoppingBag className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No orders found here.</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-slate-900 border ${selectedOrders.includes(order.id) ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-200 dark:border-slate-800'} rounded-2xl overflow-hidden shadow-sm dark:shadow-none hover:shadow-md transition-all relative`}
              >
                <div className="absolute top-4 left-4 z-10">
                   <button 
                     onClick={() => toggleSelectOrder(order.id)}
                     className={`p-1 rounded-md transition-colors ${selectedOrders.includes(order.id) ? 'text-blue-600 dark:text-blue-500' : 'text-slate-300 dark:text-slate-700 hover:text-slate-500'}`}
                   >
                     <CheckSquare className="w-5 h-5" />
                   </button>
                </div>

                <div className="p-6 pl-12">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Order #{order.id?.slice(-6) || 'N/A'}
                          <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </h3>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {order.customerName}
                        </div>
                        <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
                          Total: ₹{order.totalAmount}
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {order.items.map((item: any) => (
                          <span key={item.itemId} className="mr-3">
                            {item.quantity}x {item.name},
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                      {order.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(order.id, 'accepted')}
                            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Accept
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(order.id, 'rejected')}
                            className="w-full py-2 bg-red-100 dark:bg-red-600/20 hover:bg-red-200 dark:hover:bg-red-600/30 text-red-600 dark:text-red-500 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}

                      {order.status === 'accepted' && (
                        <button 
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm"
                        >
                          Start Preparing
                        </button>
                      )}

                       {order.status === 'preparing' && (
                        <button 
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-sm"
                        >
                          Mark Ready
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button 
                          onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <Truck className="w-4 h-4" /> Dispatch
                        </button>
                      )}

                      {order.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => handleStatusUpdate(order.id, 'completed')}
                          className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        // PIPELINE / KANBAN VIEW
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
          {pipelineColumns.map(column => (
            <div key={column.id} className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col gap-3">
               <div className={`p-3 rounded-xl border-t-4 ${column.color} bg-white dark:bg-slate-900/50 shadow-sm border-x border-b border-gray-200 dark:border-slate-800`}>
                  <h3 className="font-semibold text-slate-900 dark:text-white flex justify-between items-center">
                    {column.label}
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                      {orders.filter(o => o.status === column.status || (column.id === 'pending' && o.status === 'accepted')).length}
                    </span>
                  </h3>
               </div>
               
               <div className="space-y-3 flex-1">
                 {orders.filter(o => o.status === column.status || (column.id === 'pending' && o.status === 'accepted')).map(order => (
                   <motion.div 
                     key={order.id}
                     layoutId={order.id}
                     className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors"
                   >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-slate-500">#{order.id.slice(-4)}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">₹{order.totalAmount}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{order.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                         {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                      
                      {/* Quick Action */}
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                         {order.status === 'pending' && (
                            <button onClick={() => handleStatusUpdate(order.id, 'accepted')} className="w-full text-xs py-1.5 bg-green-50 dark:bg-green-600/10 text-green-600 dark:text-green-500 rounded-md font-medium hover:bg-green-100 dark:hover:bg-green-600/20">Accept</button>
                         )}
                         {order.status === 'accepted' && (
                            <button onClick={() => handleStatusUpdate(order.id, 'preparing')} className="w-full text-xs py-1.5 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 rounded-md font-medium hover:bg-blue-100 dark:hover:bg-blue-600/20">Prepare</button>
                         )}
                         {order.status === 'preparing' && (
                            <button onClick={() => handleStatusUpdate(order.id, 'ready')} className="w-full text-xs py-1.5 bg-purple-50 dark:bg-purple-600/10 text-purple-600 dark:text-purple-500 rounded-md font-medium hover:bg-purple-100 dark:hover:bg-purple-600/20">Ready</button>
                         )}
                         {order.status === 'ready' && (
                            <button onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')} className="w-full text-xs py-1.5 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-500 rounded-md font-medium hover:bg-indigo-100 dark:hover:bg-indigo-600/20">Dispatch</button>
                         )}
                         {order.status === 'out_for_delivery' && (
                            <button onClick={() => handleStatusUpdate(order.id, 'completed')} className="w-full text-xs py-1.5 bg-green-50 dark:bg-green-600/10 text-green-600 dark:text-green-500 rounded-md font-medium hover:bg-green-100 dark:hover:bg-green-600/20">Complete</button>
                         )}
                      </div>
                   </motion.div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
