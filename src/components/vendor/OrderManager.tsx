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
  Phone
} from 'lucide-react';
import { getVendorOrders, updateOrderStatus } from '@/actions/order';

interface OrderManagerProps {
  user: any;
}

export default function OrderManager({ user }: OrderManagerProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'active') return ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);
    if (activeTab === 'history') return ['completed', 'rejected', 'cancelled'].includes(order.status);
    return false;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'accepted': return 'text-blue-500 bg-blue-500/10';
      case 'preparing': return 'text-orange-500 bg-orange-500/10';
      case 'ready': return 'text-purple-500 bg-purple-500/10';
      case 'out_for_delivery': return 'text-indigo-500 bg-indigo-500/10';
      case 'completed': return 'text-green-500 bg-green-500/10';
      case 'rejected': return 'text-red-500 bg-red-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          {['pending', 'active', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
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
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No orders found in this category.</p>
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <motion.div
              key={order.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Order #{order.id?.slice(-6) || 'N/A'}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </h3>
                      <span className="text-sm text-slate-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {order.customerName}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {order.deliveryMethod === 'pickup' ? 'Self Pickup' : 'Delivery'}
                      </div>
                      <div className="flex items-center gap-1 font-medium text-white">
                        Total: ₹{order.totalAmount}
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="text-sm text-slate-300">
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
                          className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
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
                      <>
                        {order.deliveryMethod === 'delivery' ? (
                          <button 
                            onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <Truck className="w-4 h-4" /> Out for Delivery
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Mark Completed
                          </button>
                        )}
                      </>
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
              
              {/* Expandable Details (Address, etc) */}
              <div className="bg-slate-950/50 px-6 py-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                 <span>Order ID: {order.id}</span>
                 {order.deliveryAddress && (
                   <span className="flex items-center gap-1">
                     <MapPin className="w-3 h-3" /> 
                     {typeof order.deliveryAddress === 'object' 
                       ? `Lat: ${order.deliveryAddress.lat}, Lng: ${order.deliveryAddress.lng}`
                       : order.deliveryAddress}
                   </span>
                 )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
