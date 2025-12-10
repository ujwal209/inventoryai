'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { ShoppingBag, Navigation, Store, MapPin, LogOut, Search, Home, Heart, User, Clock, Star, Menu, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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

// Promo Slider Component
function PromoSlider() {
  const [current, setCurrent] = useState(0);
  const slides = [
    { id: 1, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80", title: "50% OFF on First Order", subtitle: "Use code: WELCOME50" },
    { id: 2, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80", title: "Free Delivery", subtitle: "On orders above ₹500" },
    { id: 3, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80", title: "Weekend Special", subtitle: "Get free dessert with every meal" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8 group">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center px-8 md:px-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{slide.title}</h2>
            <p className="text-white/90 text-lg">{slide.subtitle}</p>
            <button className="mt-4 px-6 py-2 bg-white text-slate-900 font-bold rounded-full self-start hover:bg-orange-50 transition-colors">
              Order Now
            </button>
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full transition-all ${index === current ? 'bg-white w-6' : 'bg-white/50'}`}
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
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(user.favorites || []);
  const [favoriteVendors, setFavoriteVendors] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    // Reverse geocode initial location for display name
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`)
      .then(res => res.json())
      .then(data => setUserLocationName(data.display_name || "Unknown Location"))
      .catch(() => setUserLocationName("Unknown Location"));

    const fetchVendors = async () => {
      try {
        const data = await getNearbyVendors(userLocation);
        const vendorsWithImages = data.map((v, i) => ({
          ...v,
          image: v.business_details?.bannerUrl || `https://source.unsplash.com/random/800x600/?restaurant,food,store&sig=${i}`
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
        // Add images to favs too
        const favsWithImages = favs.map((v: any, i: number) => ({
          ...v,
          image: v.business_details?.bannerUrl || `https://source.unsplash.com/random/800x600/?restaurant,food,store&sig=${i}`
        }));
        setFavoriteVendors(favsWithImages);
      };
      fetchFavorites();
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery) {
      const listToFilter = activeTab === 'favorites' ? favoriteVendors : vendors;
      const filtered = listToFilter.filter(v => 
        v.business_details?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.business_details?.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors(activeTab === 'favorites' ? favoriteVendors : vendors);
    }
  }, [searchQuery, vendors, favoriteVendors, activeTab]);

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
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchActiveOrder, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLocationSelect = (location: { lat: number, lng: number, displayName: string }) => {
    setUserLocation({ lat: location.lat, lng: location.lng });
    setUserLocationName(location.displayName);
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">InventoryAI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'orders', icon: Clock, label: 'Orders' },
            { id: 'favorites', icon: Heart, label: 'Favorites' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setViewingStore(null); // Close store view when changing tabs
                setIsSidebarOpen(false);
                if (item.id === 'favorites' && favorites.length === 0) {
                  // Optional: prompt or just show empty state
                }
              }}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id && !viewingStore
                  ? 'bg-orange-50 text-orange-600 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-6 h-6 ${activeTab === item.id && !viewingStore ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-900'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                <p className="text-xs text-slate-500">View Profile</p>
              </div>
           </div>
           <SignOutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto h-screen relative">
        {viewingStore ? (
          <StoreView vendor={viewingStore} user={user} onBack={() => setViewingStore(null)} />
        ) : activeTab === 'profile' ? (
          <ProfileView user={user} />
        ) : activeTab === 'orders' ? (
          <OrderTracking onClose={() => setActiveTab('home')} user={user} />
        ) : (
          <>
            {/* Header / Search */}
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {activeTab === 'favorites' ? 'Your Favorites' : `Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, User!`}
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base">
                      {activeTab === 'favorites' ? 'Stores you love ❤️' : 'What are you looking for today?'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {/* Store Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for restaurants, items..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
                
                {/* Location Autocomplete */}
                <LocationAutocomplete 
                  onLocationSelect={handleLocationSelect} 
                  currentLocationName={userLocationName}
                />
              </div>
            </div>

            {activeTab === 'home' && <PromoSlider />}

            {/* Categories / Filters (Optional) */}
            {activeTab === 'home' && (
              <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'Restaurants', 'Grocery', 'Pharmacy', 'Electronics'].map((cat, i) => (
                  <button 
                    key={cat}
                    className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      i === 0 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-200 hover:text-orange-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Vendor List */}
            <div className="pb-20">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                {activeTab === 'favorites' ? `Favorite Stores (${filteredVendors.length})` : `Nearby Stores (${filteredVendors.length})`}
              </h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVendors.map((vendor, index) => (
                  <motion.div
                    key={vendor.uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedVendor(vendor)}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer group hover:shadow-xl ${
                      selectedVendor?.uid === vendor.uid ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-100 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="w-full h-48 rounded-xl overflow-hidden relative flex-shrink-0 mb-4">
                        <img 
                          src={vendor.image} 
                          alt={vendor.business_details?.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-900 flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> 4.5
                        </div>
                        <button 
                          onClick={(e) => handleToggleFavorite(e, vendor.uid)}
                          className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
                        >
                          <Heart className={`w-5 h-5 ${favorites.includes(vendor.uid) ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
                        </button>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                              {vendor.business_details?.name}
                            </h3>
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                              <Navigation className="w-3 h-3" /> {vendor.distance?.toFixed(1)} km
                            </span>
                          </div>
                          <p className="text-slate-500 text-sm mt-1 line-clamp-2">{vendor.business_details?.address}</p>
                          <div className="flex gap-2 mt-3">
                             <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">Open Now</span>
                             <span className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100">Delivery Available</span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingStore(vendor);
                          }}
                          className="w-full mt-4 px-6 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-slate-900/10 hover:shadow-orange-600/20"
                        >
                          View Menu
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filteredVendors.length === 0 && (
                  <div className="col-span-full text-center py-20 text-slate-500">
                    <p>No stores found.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Live Order Widget */}
            <AnimatePresence>
              {activeOrder && activeTab !== 'orders' && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  onClick={() => setActiveTab('orders')}
                  className="fixed bottom-6 right-6 left-6 lg:left-[calc(16rem+1.5rem)] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform z-30 flex items-center justify-between border border-slate-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center animate-pulse">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-orange-400 uppercase tracking-wider mb-0.5">Live Order</p>
                      <h3 className="font-bold text-lg">{activeOrder.items.length} items from {activeOrder.vendorId ? 'Store' : 'Store'}</h3>
                      <p className="text-slate-400 text-sm capitalize">{activeOrder.status.replace(/_/g, ' ')} • ₹{activeOrder.totalAmount}</p>
                    </div>
                  </div>
                  <div className="bg-white/10 p-2 rounded-full">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
