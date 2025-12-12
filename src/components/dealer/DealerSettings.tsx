'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Save, Loader2, MapPin, Store, Upload, FileText, Clock, CreditCard, Camera, Image as ImageIcon } from 'lucide-react';
import { updateVendorLocation } from '@/actions/vendor'; 
import { uploadProductImage } from "@/actions/inventory_manager";
import { motion } from "framer-motion";
import { toast } from 'sonner';

const VendorMap = dynamic(
  () => import('../vendor/VendorMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-slate-900/50 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading Map...</span>
      </div>
    )
  }
);

export default function DealerSettings({ user }: { user: any }) {
  const details = user.business_details || {};
  
  const [location, setLocation] = useState(user.location || { lat: 20.5937, lng: 78.9629 });
  const [storeName, setStoreName] = useState(details.name || "");
  const [phone, setPhone] = useState(details.phone || "");
  const [address, setAddress] = useState(details.address || "");
  const [gstin, setGstin] = useState(details.gstin || "");
  const [minOrderAcc, setMinOrderAcc] = useState(details.minOrderAcc || "");
  const [opensAt, setOpensAt] = useState(details.opensAt || "09:00");
  const [closesAt, setClosesAt] = useState(details.closesAt || "21:00");
  const [logoUrl, setLogoUrl] = useState(details.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(details.bannerUrl || "");
  
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    if (!file) return;
    const isLogo = type === 'logo';
    isLogo ? setUploadingLogo(true) : setUploadingBanner(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const url = await uploadProductImage(formData); // Reusing product upload for now
      if (isLogo) setLogoUrl(url);
      else setBannerUrl(url);
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded!`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      isLogo ? setUploadingLogo(false) : setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!storeName || !phone) {
      toast.error("Store Name and Phone are required");
      return;
    }

    setSaving(true);
    try {
      const plainLocation = { lat: location.lat, lng: location.lng };
      await updateVendorLocation(plainLocation, {
        name: storeName,
        phone,
        address,
        gstin,
        minOrderAcc,
        opensAt,
        closesAt,
        logoUrl,
        bannerUrl
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto pb-20 space-y-8"
    >
      {/* Header / Banner Section */}
      <div className="relative group rounded-3xl overflow-hidden bg-gray-100 dark:bg-slate-800 h-64 md:h-80 border border-gray-200 dark:border-slate-800 shadow-sm">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Store Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
             <ImageIcon className="w-12 h-12 opacity-50" />
             <span className="ml-2">Add Store Banner</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <button 
             onClick={() => bannerInputRef.current?.click()}
             className="bg-white/20 backdrop-blur-md border border-white/50 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/30 transition-colors"
           >
             {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
             Change Banner
           </button>
        </div>
        <input 
          type="file" 
          ref={bannerInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} 
        />
      </div>

      <div className="px-6 md:px-10 relative -mt-20">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
           <div className="flex items-end gap-6">
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-950 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-16 h-16 text-slate-300" />
                  )}
                </div>
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-500 transition-colors z-10"
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')} 
                />
              </div>
              <div className="mb-4 hidden md:block">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white drop-shadow-sm">{storeName || 'Your Store Name'}</h1>
                <p className="text-slate-500 dark:text-slate-400">{address || 'Set your location'}</p>
              </div>
           </div>
           
           <div className="flex gap-3 mb-4 w-full md:w-auto">
             <button
               onClick={handleSave}
               disabled={saving}
               className="flex-1 md:flex-none px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
             >
               {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
               Save Changes
             </button>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 px-4 md:px-0">
         {/* Left Column: Forms */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Business Info */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                 <Store className="w-5 h-5 text-purple-500" /> Business Information
               </h2>
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Store Name *</label>
                    <input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. Daily Needs Mart"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact Number *</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                       <FileText className="w-4 h-4" /> GSTIN / Tax ID
                    </label>
                    <input
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. 29ABCDE1234F1Z5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                       <CreditCard className="w-4 h-4" /> Min. Order Acceptance
                    </label>
                    <input
                      value={minOrderAcc}
                      onChange={(e) => setMinOrderAcc(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. ₹500"
                    />
                  </div>
               </div>
            </div>

            {/* Operational Info */}
             <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                 <Clock className="w-5 h-5 text-blue-500" /> Operational Hours
               </h2>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Opens At</label>
                    <input
                      type="time"
                      value={opensAt}
                      onChange={(e) => setOpensAt(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Closes At</label>
                    <input
                      type="time"
                      value={closesAt}
                      onChange={(e) => setClosesAt(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
               </div>
             </div>

            {/* Address */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                 <MapPin className="w-5 h-5 text-green-500" /> Address Details
               </h2>
               <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950/50 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all min-h-[100px] resize-none"
                  placeholder="Street Address, Area, Landmark, City, Pincode..."
               />
            </div>
         </div>

         {/* Right Column: Map */}
         <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 h-full flex flex-col shadow-sm sticky top-24">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pin Location</h2>
               <p className="text-sm text-slate-500 mb-6">Drag the marker to your exact shop location.</p>
               <div className="flex-1 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 min-h-[300px]">
                 <VendorMap 
                   location={location} 
                   setLocation={setLocation} 
                   hasLocation={true} 
                 />
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
