'use client';

import { useState } from 'react';
import { Search, MapPin, Star, Phone, MessageSquare, Truck, Filter } from 'lucide-react';

export default function VendorDiscovery({ vendors = [] }: { vendors?: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find Vendors</h1>
          <p className="text-slate-500 dark:text-slate-400">Discover top-rated suppliers near you.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <button className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="h-48 overflow-hidden relative">
              <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                {vendor.rating}
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-white">
                {vendor.category}
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{vendor.name}</h3>
              <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <MapPin className="w-3 h-3" /> {vendor.location}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl mb-4">
                <div className="text-center">
                   <p className="text-slate-400 mb-0.5">Delivery</p>
                   <p className="font-medium flex items-center justify-center gap-1"><Truck className="w-3 h-3" /> {vendor.delivery}</p>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />
                <div className="text-center">
                   <p className="text-slate-400 mb-0.5">Min Order</p>
                   <p className="font-medium">{vendor.minOrder}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors">
                  View Catalog
                </button>
                <button className="p-2 border border-gray-200 dark:border-slate-800 rounded-lg text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-purple-600">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
