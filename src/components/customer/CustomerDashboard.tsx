'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { ShoppingBag, Navigation, Store, MapPin, LogOut, Search, Home, Heart, User, Clock, Star, Menu, X, ChevronLeft, ChevronRight, Filter, Zap, Smartphone, Shirt, Pill, ShoppingCart, Utensils, Laptop, Gift } from 'lucide-react';
import SignOutButton from "@/components/auth/SignOutButton";
import { getNearbyVendors } from "@/actions/customer";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StoreView from "./StoreView";
import { motion, AnimatePresence } from "framer-motion";
import LocationAutocomplete from "./LocationAutocomplete";
import ProfileView from "./ProfileView";
import OrderTracking from "./OrderTracking";
import { toggleFavorite, getFavorites } from "@/actions/customer";
import { getCustomerOrders } from "@/actions/order";

// Enhanced Promo Slider
function PromoSlider() {
  const [current, setCurrent] = useState(0);
  const slides = [
    { 
      id: 1, 
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80", 
      title: "Super Sale Live Now", 
      subtitle: "Up to 50% OFF on Top Electronics",
      color: "from-blue-600 to-indigo-900" 
    },
    { 
      id: 2, 
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80", 
      title: "Hungry? We Delivered.", 
      subtitle: "Flat 20% OFF on First Food Order",
      color: "from-orange-500 to-red-900"
    },
    { 
      id: 3, 
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80", 
      title: "Refresh Your Wardrobe", 
      subtitle: "New Styles Added Everyday",
      color: "from-pink-500 to-rose-900"
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden mb-8 shadow-2xl group mx-1">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-[20s]" />
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-80 mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 md:p-12 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={index === current ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 leading-tight tracking-tight drop-shadow-md">
                {slide.title}
              </h2>
              <p className="text-white/90 text-lg md:text-xl font-medium mb-6 drop-shadow">{slide.subtitle}</p>
              <button className="px-8 py-3 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100 transition-all hover:scale-105 shadow-xl">
                Shop Now
              </button>
            </motion.div>
          </div>
        </div>
      ))}
      <div className="absolute bottom-6 right-6 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${index === current ? 'bg-white w-8' : 'bg-white/40 w-4 hover:bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function CustomerDashboard({ user }: { user: any }) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [viewingStore, setViewingStore] = useState<any>(null);
  const [userLocation, setUserLocation] = useState(user.location || { lat: 20.5937, lng: 78.9629 });
  const [userLocationName, setUserLocationName] = useState("Loading location...");
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(user.favorites || []);
  const [favoriteVendors, setFavoriteVendors] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    { id: 'All', icon: Zap, label: 'All', color: 'bg-slate-100 text-slate-700' },
    { id: 'food', icon: Utensils, label: 'Food', color: 'bg-orange-100 text-orange-600' },
    { id: 'electronics', icon: Smartphone, label: 'Electronics', color: 'bg-blue-100 text-blue-600' },
    { id: 'grocery', icon: ShoppingCart, label: 'Grocery', color: 'bg-green-100 text-green-600' },
    { id: 'fashion', icon: Shirt, label: 'Fashion', color: 'bg-pink-100 text-pink-600' },
    { id: 'pharmacy', icon: Pill, label: 'Pharmacy', color: 'bg-teal-100 text-teal-600' },
    { id: 'computers', icon: Laptop, label: 'Computers', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'gifts', icon: Gift, label: 'Gifts', color: 'bg-purple-100 text-purple-600' },
  ];

  useEffect(() => {
    // Reverse geocode initial location for display name
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`)
      .then(res => res.json())
      .then(data => setUserLocationName(data.display_name?.split(',')[0] || "Unknown Location"))
      .catch(() => setUserLocationName("Select Location"));

    const fetchVendors = async () => {
      try {
        const data = await getNearbyVendors(userLocation);
        const vendorsWithImages = data.map((v, i) => ({
          ...v,
          // Generate a category for demo purposes if not present
          category: v.category || ['food', 'grocery', 'electronics', 'fashion'][i % 4], 
          image: v.business_details?.bannerUrl || `https://source.unsplash.com/random/800x600/?${v.category || 'store'}&sig=${i}`
        }));
        setVendors(vendorsWithImages);
        setFilteredVendors(vendorsWithImages);
      } catch (error) {
        console.error("Failed to fetch vendors", error);
      }
    };
    fetchVendors();
  }, [userLocation]);

  useEffect(() => {
    if (activeTab === 'favorites') {
      const fetchFavorites = async () => {
        const favs = await getFavorites();
        const favsWithImages = favs.map((v: any, i: number) => ({
          ...v,
          image: v.business_details?.bannerUrl || `https://source.unsplash.com/random/800x600/?restaurant,store&sig=${i}`
        }));
        setFavoriteVendors(favsWithImages);
      };
      fetchFavorites();
    }
  }, [activeTab]);

  useEffect(() => {
    let listToFilter = activeTab === 'favorites' ? favoriteVendors : vendors;
    
    // Category Filter
    if (selectedCategory !== 'All') {
      listToFilter = listToFilter.filter(v => 
        v.category?.toLowerCase() === selectedCategory.toLowerCase() || 
        (selectedCategory === 'food' && !v.category) // Assume food if undefined for demo
      );
    }

    // Search Filter
    if (searchQuery) {
      listToFilter = listToFilter.filter(v => 
        v.business_details?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.business_details?.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredVendors(listToFilter);
  }, [searchQuery, vendors, favoriteVendors, activeTab, selectedCategory]);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      try {
        const orders = await getCustomerOrders();
        const active = orders.find((o: any) => ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status));
        setActiveOrder(active);
      } catch (error) {
        console.error("Failed to fetch active order", error);
      }
    };
    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLocationSelect = (location: { lat: number, lng: number, displayName: string }) => {
    setUserLocation({ lat: location.lat, lng: location.lng });
    setUserLocationName(location.displayName.split(',')[0]);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, vendorId: string) => {
    e.stopPropagation();
    try {
      const result = await toggleFavorite(vendorId);
      setFavorites(result.favorites);
      if (activeTab === 'favorites') {
        setFavoriteVendors(prev => prev.filter(v => v.uid !== vendorId));
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Navigation */}
      <div className={`w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50 transition-all duration-300 ${isSidebarOpen ? 'w-64 translate-x-0' : 'hidden md:flex'}`}>
        <div className="p-4 lg:p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer" onClick={() => setActiveTab('home')}>
            <span className="text-white font-bold text-xl">I</span>
          </div>
          <span className="font-bold text-xl text-slate-800 hidden lg:block tracking-tight">InventoryAI</span>
        </div>

        <div className="flex-1 px-3 py-6 space-y-2">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'orders', icon: Clock, label: 'Orders' },
            { id: 'favorites', icon: Heart, label: 'Wishlist' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setViewingStore(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative ${
                activeTab === item.id && !viewingStore
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-6 h-6 shrink-0" />
              <span className="font-medium hidden lg:block">{item.label}</span>
              {/* Tooltip for mobile sidebar */}
              <span className="hidden group-hover:block lg:group-hover:hidden absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100">
           <SignOutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-20 lg:ml-64 p-4 md:p-6 pb-24 overflow-y-auto h-screen relative scroll-smooth">
        {viewingStore ? (
          <StoreView vendor={viewingStore} user={user} onBack={() => setViewingStore(null)} />
        ) : activeTab === 'profile' ? (
          <ProfileView user={user} />
        ) : activeTab === 'orders' ? (
          <OrderTracking onClose={() => setActiveTab('home')} user={user} />
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Header: Search & Location */}
            <div className={`sticky top-0 z-40 bg-slate-50/95 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 md:-mx-6 md:px-6 transition-all`}>
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 w-full">
                     <button className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <Menu className="w-6 h-6 text-slate-700" />
                     </button>
                     
                     <div className="flex-1 flex gap-2">
                        <div className="relative flex-1 group">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                           <input 
                              type="text" 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search InventoryAI..." 
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                           />
                        </div>
                     </div>
                     
                     <LocationAutocomplete 
                        onLocationSelect={handleLocationSelect} 
                        currentLocationName={userLocationName}
                     />
                  </div>
               </div>
            </div>

            {/* Content Body */}
            <div className="space-y-8 animate-in fade-in duration-500">
               {activeTab === 'home' && (
                 <>
                   <PromoSlider />

                   {/* Categories */}
                   <div>
                      <div className="flex justify-between items-center mb-4 px-1">
                         <h2 className="text-xl font-bold text-slate-900">Explore Categories</h2>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                         {categories.map((cat) => (
                            <button
                               key={cat.id}
                               onClick={() => setSelectedCategory(cat.id)}
                               className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                                  selectedCategory === cat.id 
                                    ? 'bg-slate-900 text-white shadow-xl scale-105' 
                                    : 'bg-white text-slate-600 hover:bg-white hover:shadow-lg hover:-translate-y-1'
                               }`}
                            >
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedCategory === cat.id ? 'bg-white/20' : cat.color}`}>
                                  <cat.icon className="w-6 h-6" />
                               </div>
                               <span className="text-xs font-bold whitespace-nowrap">{cat.label}</span>
                            </button>
                         ))}
                      </div>
                   </div>
                 </>
               )}

               {/* Store Listing */}
               <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                     {selectedCategory !== 'All' ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Stores` : (activeTab === 'favorites' ? 'Your Wishlist' : 'Recommended For You')}
                     <span className="text-sm font-normal text-slate-400">({filteredVendors.length})</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {filteredVendors.map((vendor, index) => (
                        <motion.div
                           key={vendor.uid}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: index * 0.05 }}
                           onClick={() => setViewingStore(vendor)}
                           className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex flex-col h-full"
                        >
                           <div className="relative h-48 overflow-hidden">
                              <img 
                                 src={vendor.image} 
                                 alt={vendor.business_details?.name}
                                 className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              <button 
                                 onClick={(e) => handleToggleFavorite(e, vendor.uid)}
                                 className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full text-slate-600 hover:text-red-500 hover:bg-white transition-colors shadow-sm z-10"
                              >
                                 <Heart className={`w-5 h-5 ${favorites.includes(vendor.uid) ? 'fill-red-500 text-red-500' : ''}`} />
                              </button>
                              
                              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                                 <Star className="w-3 h-3 text-orange-500 fill-orange-500" /> 4.5
                              </div>
                              <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                                 {vendor.distance?.toFixed(1)} km
                              </div>
                           </div>

                           <div className="p-4 flex flex-col flex-1">
                              <div className="flex justify-between items-start mb-2">
                                 <h3 className="font-bold text-slate-900 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                                    {vendor.business_details?.name}
                                 </h3>
                              </div>
                              <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
                                 {vendor.business_details?.address || "Premium Seller"}
                              </p>
                              
                              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {vendor.category || 'Store'}
                                 </span>
                                 <span className="text-sm font-bold text-slate-900 group-hover:underline decoration-blue-500 underline-offset-4">
                                    Visit Store →
                                 </span>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </div>
                  
                  {filteredVendors.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">No stores found in this category.</p>
                     </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Order Floating Widget */}
      <AnimatePresence>
        {activeOrder && activeTab !== 'orders' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setActiveTab('orders')}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl cursor-pointer hover:-translate-y-1 transition-transform z-50 border border-slate-800 flex items-center gap-4"
          >
             <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-6 h-6 text-white" />
             </div>
             <div className="flex-1">
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-0.5">Order in Progress</p>
                <div className="flex justify-between items-baseline">
                   <h3 className="font-bold text-white">#{activeOrder.id.slice(-4)}</h3>
                   <span className="text-xs text-slate-400 capitalize">{activeOrder.status.replace('_', ' ')}</span>
                </div>
             </div>
             <ChevronRight className="w-5 h-5 text-slate-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
