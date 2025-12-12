'use client';

import { useState, useEffect } from "react";
import { completeOnboarding } from "@/actions/onboarding";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Truck, ArrowRight, Loader2, User, MapPin, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [role, setRole] = useState<"vendor" | "dealer" | "customer" | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleHoliday = (day: string) => {
    setSelectedHolidays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleGetLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location", error);
          setGettingLocation(false);
          alert("Could not get your location. Please enable location services.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (role) formData.set("role", role);
    if (location) formData.set("location", JSON.stringify(location));
    
    try {
      await completeOnboarding(formData);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full my-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to InventoryAI</h1>
          <p className="text-slate-400 text-lg">Choose your role to get started</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRole("vendor")}
              className={cn(
                "cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200",
                role === "vendor"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              )}
            >
              <Store className={cn("w-12 h-12 mb-4", role === "vendor" ? "text-blue-400" : "text-slate-500")} />
              <h3 className="text-xl font-semibold text-white mb-2">Vendor</h3>
              <p className="text-slate-400 text-sm">
                Shopkeeper managing inventory & sales.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRole("dealer")}
              className={cn(
                "cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200",
                role === "dealer"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              )}
            >
              <Truck className={cn("w-12 h-12 mb-4", role === "dealer" ? "text-purple-400" : "text-slate-500")} />
              <h3 className="text-xl font-semibold text-white mb-2">Dealer</h3>
              <p className="text-slate-400 text-sm">
                Distributor managing supply chain.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRole("customer")}
              className={cn(
                "cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200",
                role === "customer"
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              )}
            >
              <User className={cn("w-12 h-12 mb-4", role === "customer" ? "text-green-400" : "text-slate-500")} />
              <h3 className="text-xl font-semibold text-white mb-2">Customer</h3>
              <p className="text-slate-400 text-sm">
                Shopper looking for local stores.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: role ? 1 : 0, height: role ? "auto" : 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-medium text-white">
                {role === 'customer' ? 'Your Details' : 'Business Details'}
              </h3>
              
              {role !== 'customer' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Business Name</label>
                    <input
                      name="businessName"
                      required={role !== 'customer'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g. Sharma General Store"
                    />
                  </div>

                  {role === 'vendor' && (
                    <div className="space-y-2">
                       <label className="text-sm text-slate-400">GSTIN (Optional)</label>
                       <input
                         name="gstin"
                         className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors uppercase"
                         placeholder="22AAAAA0000A1Z5"
                       />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Phone Number</label>
                  <input
                    name="phone"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="+91 98765 43210"
                  />
                </div>
                
                {role === 'customer' ? (
                   <div className="space-y-2">
                     <label className="text-sm text-slate-400">Current Location</label>
                     <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={handleGetLocation}
                         className={cn(
                           "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors",
                           location 
                             ? "bg-green-500/20 border-green-500 text-green-400" 
                             : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                         )}
                       >
                         {gettingLocation ? (
                           <Loader2 className="w-4 h-4 animate-spin" />
                         ) : (
                           <MapPin className="w-4 h-4" />
                         )}
                         {location ? "Location Captured" : "Use My Current Location"}
                       </button>
                     </div>
                     {location && <p className="text-xs text-green-500">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>}
                   </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">City/Location</label>
                    <input
                      name="address"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                )}
              </div>

              {/* Advanced Vendor Fields */}
              {role === 'vendor' && (
                <div className="pt-4 border-t border-slate-800 space-y-6">
                  <h4 className="text-md font-medium text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Store Timings & Operations
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Opens At</label>
                      <input
                        type="time"
                        name="opensAt"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Closes At</label>
                      <input
                        type="time"
                        name="closesAt"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Min. Order for Acceptance (₹)</label>
                    <input
                      type="number"
                      name="minOrderAcc"
                      defaultValue={0}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Weekly Holidays
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleHoliday(day)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            selectedHolidays.includes(day)
                              ? "bg-red-500/20 text-red-400 border border-red-500/50"
                              : "bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" name="holidays" value={JSON.stringify(selectedHolidays)} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (role === 'customer' && !location)}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl mt-6 flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Complete Setup <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
