'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Truck, Store, CreditCard, Loader2, Clock } from 'lucide-react';
import { createOrder } from '@/actions/order';

interface CheckoutViewProps {
  cart: { [key: string]: number };
  items: any[];
  vendor: any;
  user: any;
  onBack: () => void;
  onOrderPlaced: () => void;
}

export default function CheckoutView({ cart, items, vendor, user, onBack, onOrderPlaced }: CheckoutViewProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState(typeof user.location === 'string' ? user.location : '');
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
    const item = items.find(i => i.id === itemId);
    return { ...item, quantity };
  }).filter(i => i.id);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const deliveryFee = deliveryMethod === 'delivery' ? 40 : 0; // Flat fee for now
  const total = subtotal + deliveryFee;

  // Mock distance calculation
  useEffect(() => {
    if (deliveryMethod === 'delivery' && address) {
      // In a real app, use Google Maps API here
      setDistance('2.5 km');
      setEstimatedTime('35 mins');
    } else {
      setDistance(null);
      setEstimatedTime(null);
    }
  }, [address, deliveryMethod]);

  const handlePlaceOrder = async () => {
    if (deliveryMethod === 'delivery' && !address) {
      alert("Please enter a delivery address");
      return;
    }

    setLoading(true);
    try {
      await createOrder({
        vendorId: vendor.uid,
        items: cartItems.map(item => ({
          itemId: item.id,
          name: item.name,
          price: item.sellingPrice,
          quantity: item.quantity,
          image: item.image // Pass image URL
        })),
        totalAmount: total,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? address : null,
        estimatedTime: estimatedTime || '30 mins' // Default or calculated
      });
      onOrderPlaced();
    } catch (error) {
      console.error("Order failed", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto min-h-full bg-white shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 sticky top-0 bg-white z-10">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
        </div>

        <div className="flex-1 p-6 space-y-8">
          {/* Order Summary */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                      {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium text-slate-900">₹{item.sellingPrice * item.quantity}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Method */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Delivery Method</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  deliveryMethod === 'pickup' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-slate-100 hover:border-orange-200 text-slate-500'
                }`}
              >
                <Store className="w-6 h-6" />
                <span className="font-bold">Self Pickup</span>
              </button>
              <button
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  deliveryMethod === 'delivery' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-slate-100 hover:border-orange-200 text-slate-500'
                }`}
              >
                <Truck className="w-6 h-6" />
                <span className="font-bold">Delivery</span>
              </button>
            </div>
          </section>

          {/* Delivery Details */}
          {deliveryMethod === 'delivery' && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900">Delivery Address</h2>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              {distance && (
                <div className="flex items-center gap-4 text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Distance: <strong>{distance}</strong></span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Est. Time: <strong>{estimatedTime}</strong></span>
                </div>
              )}
            </motion.section>
          )}

          {/* Payment (Mock) */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Payment</h2>
            <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900">Cash on Delivery / Pay at Counter</span>
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-orange-500" />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {deliveryMethod === 'delivery' && (
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
