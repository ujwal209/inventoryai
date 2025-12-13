'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, ArrowLeft, MapPin, Truck, Store as StoreIcon, Loader2, MessageCircle, Star, Clock, Search, ShoppingBag } from "lucide-react";
import { getVendorInventoryForCustomer } from "@/actions/customer";
import ChatWindow from "./ChatWindow";
import CheckoutView from "./CheckoutView";
import OrderTracking from "./OrderTracking";

interface StoreViewProps {
  vendor: any;
  onBack: () => void;
  user: any;
}

export default function StoreView({ vendor, onBack, user }: StoreViewProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showCart, setShowCart] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [viewState, setViewState] = useState<'store' | 'checkout' | 'orders'>('store');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      const data = await getVendorInventoryForCustomer(vendor.uid);
      // Add Unsplash images if missing
      setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, [vendor.uid]);

  const addToCart = (itemId: string) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const cartTotal = items.reduce((total, item) => {
    const quantity = cart[item.id] || 0;
    return total + (item.sellingPrice || 0) * quantity;
  }, 0);

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (viewState === 'checkout') {
    return (
      <CheckoutView 
        cart={cart}
        items={items}
        vendor={vendor}
        user={user}
        onBack={() => setViewState('store')}
        onOrderPlaced={() => {
          setCart({});
          setViewState('orders');
        }}
      />
    );
  }

  if (viewState === 'orders') {
    return <OrderTracking onClose={() => setViewState('store')} />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative animate-in fade-in duration-300">
      {/* Hero / Header */}
      <div className="relative h-72 bg-slate-900">
        <img 
          src={vendor.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"} 
          alt={vendor.business_details?.name} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <button onClick={onBack} className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
             <button 
               onClick={() => setViewState('orders')}
               className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full text-white transition-colors"
               title="My Orders"
             >
               <ShoppingBag className="w-6 h-6" />
             </button>
             <button 
               onClick={() => setShowChat(!showChat)}
               className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full text-white transition-colors"
             >
               <MessageCircle className="w-6 h-6" />
             </button>
             <button 
               onClick={() => setShowCart(true)}
               className="relative p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-full transition-colors shadow-lg shadow-orange-600/30"
             >
               <ShoppingCart className="w-6 h-6" />
               {cartItemCount > 0 && (
                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-orange-600 rounded-full text-xs flex items-center justify-center font-bold shadow-sm">
                   {cartItemCount}
                 </span>
               )}
             </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold mb-2"
          >
            {vendor.business_details?.name}
          </motion.h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm"><MapPin className="w-4 h-4" /> {vendor.business_details?.address}</span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.5 (500+)</span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm"><Clock className="w-4 h-4" /> 30-40 min</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="Search for dishes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 focus:outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-6 pt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Menu</h2>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No items found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all group duration-300"
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 line-clamp-1 text-lg">{item.name}</h3>
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">₹{item.sellingPrice}</span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{item.description || "No description available."}</p>
                  
                  {cart[item.id] ? (
                    <div className="flex items-center justify-between bg-slate-100 rounded-xl p-1">
                      <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-slate-900 shadow-sm hover:bg-slate-50 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-slate-900 text-lg">{cart[item.id]}</span>
                      <button onClick={() => addToCart(item.id)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-slate-900 shadow-sm hover:bg-slate-50 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(item.id)}
                      className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-orange-600"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Window */}
      {showChat && (
        <ChatWindow 
          key={vendor.uid}
          user={user} 
          vendorId={vendor.uid} 
          vendorName={vendor.business_details?.name} 
          onClose={() => setShowChat(false)} 
        />
      )}

      {/* Cart Sidebar / Modal */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-white z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-600" /> Your Cart
                </h2>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {Object.entries(cart).map(([itemId, quantity]) => {
                  const item = items.find(i => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="flex gap-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                         {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-slate-900 font-bold line-clamp-1">{item.name}</h4>
                        <p className="text-slate-500 text-sm font-medium">₹{item.sellingPrice * quantity}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => removeFromCart(itemId)} className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><Minus className="w-3 h-3"/></button>
                          <span className="text-sm font-bold text-slate-900">{quantity}</span>
                          <button onClick={() => addToCart(itemId)} className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><Plus className="w-3 h-3"/></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {cartItemCount === 0 && (
                  <div className="text-center text-slate-500 mt-20">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="font-medium">Your cart is empty</p>
                    <p className="text-sm mt-1">Add items to start your order</p>
                  </div>
                )}
              </div>

              {cartItemCount > 0 && (
                <div className="p-6 bg-white border-t border-slate-100 space-y-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between text-slate-900 font-bold text-xl">
                    <span>Total</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      setShowCart(false);
                      setViewState('checkout');
                    }}
                    className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
