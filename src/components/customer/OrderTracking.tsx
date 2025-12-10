'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, MapPin, ChevronRight, X, Store, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { getCustomerOrders, updateOrderStatus } from '@/actions/order';
import ChatWindow from './ChatWindow';

interface OrderTrackingProps {
  onClose: () => void;
  user: any;
}

export default function OrderTracking({ onClose, user }: OrderTrackingProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [chatVendor, setChatVendor] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getCustomerOrders();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!orderId) return;
    setCancellingId(orderId);
    try {
      await updateOrderStatus(orderId, 'cancelled');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      setShowCancelConfirm(null);
    } catch (error) {
      console.error("Failed to cancel order", error);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed'];
    return steps.indexOf(status);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for confirmation';
      case 'accepted': return 'Order Accepted';
      case 'preparing': return 'Preparing your order';
      case 'ready': return 'Ready for Pickup';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'completed': return 'Delivered';
      case 'rejected': return 'Order Rejected';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    if (['completed', 'ready'].includes(status)) return 'bg-green-500';
    if (['rejected', 'cancelled'].includes(status)) return 'bg-red-500';
    if (status === 'out_for_delivery') return 'bg-indigo-500';
    if (status === 'preparing') return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto min-h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Orders</h1>
            <p className="text-sm text-slate-500">Track your current and past orders</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No orders yet</h3>
              <p className="max-w-xs text-center">Looks like you haven't placed any orders yet. Start shopping to see your orders here!</p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
              >
                Browse Stores
              </button>
            </div>
          ) : (
            orders.map((order, index) => (
              <motion.div 
                key={order.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Status Badge */}
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-xs font-bold text-white capitalize ${getStatusColor(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </div>

                <div className="flex justify-between items-start mb-6 mt-2">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      order.deliveryMethod === 'delivery' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {order.deliveryMethod === 'delivery' ? <Truck className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Order #{order.id?.slice(-6) || 'N/A'}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {!['rejected', 'cancelled'].includes(order.status) && (
                  <div className="mb-8 bg-slate-50 p-4 rounded-xl">
                    <div className="flex justify-between text-xs font-semibold text-slate-400 mb-3 px-1">
                      <span className={getStatusStep(order.status) >= 0 ? 'text-slate-900' : ''}>Confirmed</span>
                      <span className={getStatusStep(order.status) >= 2 ? 'text-slate-900' : ''}>Preparing</span>
                      <span className={getStatusStep(order.status) >= 4 ? 'text-slate-900' : ''}>{order.deliveryMethod === 'delivery' ? 'On Way' : 'Ready'}</span>
                      <span className={getStatusStep(order.status) >= 5 ? 'text-slate-900' : ''}>Delivered</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden relative">
                      <motion.div 
                        className={`h-full rounded-full ${getStatusColor(order.status)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((getStatusStep(order.status) + 1) * 25, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-700">
                      {order.status === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                      {getStatusLabel(order.status)}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm py-3 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-xs">
                              {item.quantity}x
                            </span>
                            <span className="text-slate-900 font-medium text-base">{item.name}</span>
                          </div>
                          <p className="text-slate-500 text-xs">Item Price: ₹{item.price}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-lg">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Amount</span>
                    <span className="text-xl font-bold text-slate-900">₹{order.totalAmount}</span>
                  </div>

                  {order.status === 'pending' && (
                    <div className="relative">
                      {showCancelConfirm === order.id ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2"
                        >
                          <span className="text-xs text-slate-500 mr-1">Sure?</span>
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                          >
                            {cancellingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Yes
                          </button>
                          <button 
                            onClick={() => setShowCancelConfirm(null)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            No
                          </button>
                        </motion.div>
                      ) : (
                        <button 
                          onClick={() => setShowCancelConfirm(order.id)}
                          className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  )}
                  
                  {['completed', 'cancelled', 'rejected'].includes(order.status) && (
                    <button className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-colors">
                      Reorder
                    </button>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setChatVendor({ id: order.vendorId, name: 'Store' })}
                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat with Store
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      {/* Chat Window Overlay */}
      {chatVendor && (
        <ChatWindow 
          user={user}
          vendorId={chatVendor.id}
          vendorName={chatVendor.name}
          onClose={() => setChatVendor(null)}
        />
      )}
    </div>
  );
}
