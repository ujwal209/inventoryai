'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Save, Loader2, MapPin, Store, Image as ImageIcon, Upload } from 'lucide-react';
import { updateVendorLocation } from '@/actions/vendor';
import { motion } from "framer-motion";

// Dynamically import the Map component to avoid SSR issues with Leaflet
const VendorMap = dynamic(
  () => import('./VendorMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-900/50 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading Map...</span>
      </div>
    )
  }
);

export default function SettingsView({ user }: { user: any }) {
  const [location, setLocation] = useState(user.location || { lat: 20.5937, lng: 78.9629 });
  const [businessName, setBusinessName] = useState(user.business_details?.name || "");
  const [phone, setPhone] = useState(user.business_details?.phone || "");
  const [address, setAddress] = useState(user.business_details?.address || "");
  const [bannerUrl, setBannerUrl] = useState(user.business_details?.bannerUrl || "");
  const [logoUrl, setLogoUrl] = useState(user.business_details?.logoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "inventory_ai_preset");

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Cloudinary error:", data);
        throw new Error(data.error?.message || "Upload failed");
      }
      
      if (type === 'banner') setBannerUrl(data.secure_url);
      else setLogoUrl(data.secure_url);
    } catch (error: any) {
      console.error("Upload failed", error);
      alert(`Image upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const plainLocation = { lat: location.lat, lng: location.lng };
      await updateVendorLocation(plainLocation, {
        name: businessName,
        phone,
        address,
        bannerUrl,
        logoUrl
      });
      // Success feedback could be a toast, for now we just stop loading
    } catch (error) {
      console.error(error);
      alert("Failed to update settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-5xl mx-auto pb-10"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Store Settings</h1>
          <p className="text-slate-400 mt-1">Manage your business profile, branding, and location.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Branding & Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Branding Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <ImageIcon className="w-5 h-5 text-purple-500" /> Branding
            </h2>

            {/* Banner Upload */}
            <div className="relative w-full h-48 rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 overflow-hidden group/banner transition-colors hover:border-slate-600">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Upload Store Banner</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/banner:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                <label className="cursor-pointer px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium backdrop-blur-md border border-white/20 transition-all transform hover:scale-105 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {bannerUrl ? "Change Banner" : "Upload Banner"}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                </label>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="absolute top-24 left-6">
              <div className="relative group/logo">
                <div className="w-24 h-24 rounded-2xl bg-slate-900 border-4 border-slate-900 shadow-xl overflow-hidden flex items-center justify-center relative z-20">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                <label className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 opacity-0 group-hover/logo:opacity-100 rounded-2xl cursor-pointer transition-opacity backdrop-blur-sm border-4 border-transparent">
                  <Upload className="w-6 h-6 text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                </label>
              </div>
            </div>

            <div className="mt-16 flex justify-end">
               {uploading && <span className="text-sm text-blue-400 animate-pulse flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Uploading...</span>}
            </div>
          </motion.div>

          {/* Business Details Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <Store className="w-5 h-5 text-blue-500" /> Business Details
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Business Name</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="e.g. My Awesome Store"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-400">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[100px] resize-none placeholder:text-slate-600"
                  placeholder="Full address of your store..."
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Location */}
        <div className="lg:col-span-1">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 h-full flex flex-col relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
              <MapPin className="w-5 h-5 text-green-500" /> Location
            </h2>
            <p className="text-slate-400 text-sm mb-6 relative z-10">
              Pin your store on the map so customers can find you easily.
            </p>

            <div className="flex-1 min-h-[400px] w-full rounded-xl overflow-hidden border border-slate-700 relative z-10 shadow-2xl">
              <VendorMap 
                location={location} 
                setLocation={setLocation} 
                hasLocation={!!user.location} 
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
