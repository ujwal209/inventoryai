'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import LocationAutocomplete from "./LocationAutocomplete";
import { User, Mail, MapPin, Save, Loader2, Crosshair, Phone, Camera, ShieldCheck, ShieldAlert, CheckCircle, Upload } from 'lucide-react';
import { updateCustomerProfile } from "@/actions/customer";
import { toast } from 'sonner';
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sendTwilioOtp, verifyTwilioOtp } from "@/actions/otp";

// Dynamically import the Map component to avoid SSR issues with Leaflet
const ProfileMap = dynamic(
  () => import('./ProfileMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading Map...</span>
      </div>
    )
  }
);

export default function ProfileView({ user }: { user: any }) {
  const [location, setLocation] = useState(user.location || { lat: 20.5937, lng: 78.9629 });
  const [address, setAddress] = useState(user.address || "Fetching address...");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  
  // Profile Photo
  const [photoURL, setPhotoURL] = useState(user.image || user.photoURL || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phone Verification
  const [phone, setPhone] = useState(user.phone || '');
  const [isPhoneVerified, setIsPhoneVerified] = useState(user.isPhoneVerified || false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Address Fetching Function using Leaflet/OSM
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'InventoryAI/1.0'
        }
      });
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();
      const formattedAddress = data.display_name || "Unknown Location";
      setAddress(formattedAddress);
      return formattedAddress;
    } catch (error) {
      console.error("Address fetch failed:", error);
      setAddress("Location selected (Address unavailable)");
      return null;
    }
  };

  useEffect(() => {
    if (user.location) {
      fetchAddress(user.location.lat, user.location.lng);
    } else {
      setAddress("No location set");
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!isPhoneVerified) {
        toast.error("Please verify your phone number first!");
        setSaving(false);
        return;
      }
      await updateCustomerProfile({ location, address, phone, isPhoneVerified, image: photoURL });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = (loc: { lat: number, lng: number, displayName: string }) => {
    setLocation({ lat: loc.lat, lng: loc.lng });
    setAddress(loc.displayName);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        await fetchAddress(latitude, longitude);
        setLocating(false);
      },
      (error) => {
        console.error("Error getting location", error);
        toast.error("Unable to retrieve location. Please check browser permissions.");
        setLocating(false);
        setAddress("Location access denied");
      }
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadingPhoto(true);

    try {
      const storageRef = ref(storage, `profile_images/${user.uid || 'temp'}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
      await updateCustomerProfile({ image: url });
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const startVerification = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number (e.g. +91...)");
      return;
    }
    
    setSendingOtp(true);
    try {
      // Clean phone: ensure + prefix
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`; // Assume India if no code
      
      const result = await sendTwilioOtp(formattedPhone);
      
      if (result.success) {
        setShowOtpInput(true);
        toast.success("OTP sent via SMS (Twilio)!");
      } else {
        toast.error(`Failed to send SMS: ${result.error}`);
        if (result.error?.includes("Env Vars")) {
           toast.info("Please set TWILIO_ variables in .env.local");
        }
      }
    } catch (error: any) {
       console.error("Twilio Client Error:", error);
       toast.error("Failed to send OTP.");
    } finally {
       setSendingOtp(false);
    }
  };

  const confirmVerification = async () => {
    setVerifyingOtp(true);
    try {
       const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
       const result = await verifyTwilioOtp(formattedPhone, otp);

       if (result.success) {
          setIsPhoneVerified(true);
          setShowOtpInput(false);
          toast.success("Phone Verified Successfully!");
          await updateCustomerProfile({ phone, isPhoneVerified: true });
       } else {
          toast.error(result.error || "Invalid OTP");
       }
    } catch (error) {
      console.error("Verify Error:", error);
      toast.error("Verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* User Details Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center relative group">
            <div className="relative">
               <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-white bg-slate-100 flex items-center justify-center mb-4">
                 {photoURL ? (
                   <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                     {user.email?.charAt(0).toUpperCase()}
                   </div>
                 )}
               </div>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="absolute bottom-4 right-0 bg-white p-1.5 rounded-full shadow-md text-slate-600 hover:text-blue-600 transition-colors border border-slate-100"
                 disabled={uploadingPhoto}
               >
                 {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handlePhotoUpload}
               />
            </div>

            <h2 className="text-xl font-bold text-slate-900">{user.email?.split('@')[0]}</h2>
            <p className="text-slate-500 text-sm">{user.email}</p>
            <div className="mt-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
              Customer
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-slate-400" /> Account Info
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email</label>
                <div className="flex items-center gap-2 text-slate-900 text-sm font-medium">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {user.email}
                  <ShieldCheck className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Phone Number <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                   <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if(isPhoneVerified) setIsPhoneVerified(false);
                        }}
                        placeholder="+91"
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={showOtpInput}
                      />
                      {isPhoneVerified && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                   </div>
                </div>
                
                {!isPhoneVerified && !showOtpInput && (
                   <button 
                     onClick={startVerification}
                     disabled={sendingOtp}
                     className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                   >
                     {sendingOtp ? "Sending via Twilio..." : "Verify Number"}
                   </button>
                )}

                {showOtpInput && !isPhoneVerified && (
                  <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 animate-in slide-in-from-top-2">
                     <p className="text-xs text-slate-500 mb-2">
                        Enter OTP sent to {phone}
                     </p>
                     <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="******"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-center tracking-widest font-mono"
                          maxLength={6}
                        />
                        <button 
                           onClick={confirmVerification}
                           disabled={verifyingOtp}
                           className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-bold disabled:opacity-50"
                        >
                           {verifyingOtp ? "..." : "Verify"}
                        </button>
                     </div>
                     <button onClick={() => setShowOtpInput(false)} className="text-[10px] text-slate-400 mt-2 underline">Change Number</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" /> Delivery Address
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-md truncate">{address}</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative z-10">
                  <LocationAutocomplete 
                    onLocationSelect={handleLocationSelect}
                    currentLocationName={address}
                  />
                </div>
                <button
                  onClick={handleCurrentLocation}
                  disabled={locating}
                  className="px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap border border-slate-200"
                >
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                  Locate Me (GPS)
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-h-[400px] relative z-0 bg-slate-50">
               {/* Map Container */}
               <ProfileMap location={location} setLocation={(newLoc: any) => {
                  setLocation(newLoc);
                  fetchAddress(newLoc.lat, newLoc.lng);
               }} />
            </div>
            
            <div className="p-3 bg-white text-xs font-mono text-slate-500 text-center border-t border-slate-100">
              Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
