'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import LocationAutocomplete from "./LocationAutocomplete";
import { User, Mail, MapPin, Save, Loader2, Crosshair } from 'lucide-react';

import { updateCustomerProfile } from "@/actions/customer";

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
  const [locationName, setLocationName] = useState("Loading...");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCustomerProfile({ location });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = (loc: { lat: number, lng: number, displayName: string }) => {
    setLocation({ lat: loc.lat, lng: loc.lng });
    setLocationName(loc.displayName);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        // Reverse geocode to get name
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(res => res.json())
          .then(data => setLocationName(data.display_name || "Current Location"))
          .finally(() => setLocating(false));
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location");
        setLocating(false);
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* User Details Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user.email?.split('@')[0]}</h2>
            <p className="text-slate-500 text-sm">{user.email}</p>
            <div className="mt-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
              Customer
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" /> Personal Info
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Email</label>
                <div className="flex items-center gap-2 text-slate-900">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {user.email}
                </div>
              </div>
              {/* Add more fields like Phone, Name here if available */}
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" /> Delivery Location
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Set your default delivery location.</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Location
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <LocationAutocomplete 
                    onLocationSelect={handleLocationSelect}
                    currentLocationName={locationName}
                  />
                </div>
                <button
                  onClick={handleCurrentLocation}
                  disabled={locating}
                  className="px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                  Use Current Location
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-h-[400px] relative z-0">
              <ProfileMap location={location} setLocation={setLocation} />
            </div>
            
            <div className="p-4 bg-slate-50 text-xs text-slate-500 text-center border-t border-slate-100">
              Selected Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

