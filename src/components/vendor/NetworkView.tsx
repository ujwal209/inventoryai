'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Truck, 
  Phone, 
  MessageSquare, 
  Star, 
  MoreVertical, 
  CreditCard,
  AlertCircle,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { updateRequestStatus } from "@/actions/requests";

// ... imports
interface NetworkViewProps {
  requests?: any[];
  dealers?: any[];
  onChat?: (dealer: any) => void;
}

export default function NetworkView({ requests = [], dealers = [], onChat }: NetworkViewProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'requests'>('customers');
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Create local state for requests to handle optimistic updates
  const [localRequests, setLocalRequests] = useState<any[]>(requests);

  // Sync prop with local state when it changes (revalidatePath will eventually update prop)
  useEffect(() => {
    setLocalRequests(requests);
  }, [requests]);
  
  const handleStatusUpdate = async (id: string, status: 'accepted' | 'rejected') => {
    setProcessingId(id);
    // Optimistic Update
    setLocalRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: status } : req
    ));

    try {
      await updateRequestStatus(id, status);
      // alert(`Request ${status}`);
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
      // Revert on error
      setLocalRequests(requests);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRateDealer = (req: any) => {
    setSelectedRequest(req);
    setShowRateModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Network & Relationships</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your connected dealers and requests.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto max-w-full">
           <button 
             onClick={() => setActiveTab('customers')}
             className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'customers' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
           >
             Dealers ({dealers.length})
           </button>
           <button 
             onClick={() => setActiveTab('requests')}
             className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'requests' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
           >
             Stock Requests
             <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{localRequests.length}</span>
           </button>
        </div>
      </div>

      {/* Customers Tab Content */}
      {activeTab === 'customers' && (
        <div className="grid gap-6">
           {dealers.length === 0 ? (
             <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800">
               <Users className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
               <p className="text-slate-500 dark:text-slate-400">No dealers found in your network.</p>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {dealers.map(dealer => (
                 <div key={dealer.id} className="group relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   
                   <div className="relative flex flex-col items-center text-center">
                      <div className="w-20 h-20 mb-4 p-1 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500">
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                          {dealer.image ? (
                            <img src={dealer.image} alt={dealer.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-tr from-blue-500 to-purple-500">
                              {dealer.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{dealer.name}</h3>
                      
                      <div className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-6">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>{dealer.location || 'Connected Dealer'}</span>
                      </div>

                      <div className="grid grid-cols-2 w-full gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Status</p>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full font-bold">
                            Active
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
                           <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Member Since</p>
                           <p className="text-sm font-medium text-slate-900 dark:text-white">Dec 2024</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => onChat?.(dealer)}
                        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        <MessageSquare className="w-4 h-4" /> Message Dealer
                      </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {/* Requests Tab Content */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
        {/* ... (keep existing requests logic) ... */}
           <h2 className="text-lg font-bold text-slate-900 dark:text-white">Incoming Stock Requests</h2>
           
           {localRequests.length === 0 ? (
             <div className="text-center py-10 bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800">
               <FileCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
               <p className="text-slate-500">No pending stock requests.</p>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 gap-6">
               {localRequests.map(req => (
                 <div key={req.id} className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold overflow-hidden">
                            {/* Try to find dealer image from dealers list if possible, or fallback */}
                            {dealers.find(d => d.name === req.dealer_name)?.image ? (
                              <img src={dealers.find(d => d.name === req.dealer_name)?.image} className="w-full h-full object-cover" />
                            ) : (
                              req.dealer_name ? req.dealer_name.charAt(0) : 'U'
                            )}
                          </div>
                          <div>
                             <h3 className="font-semibold text-slate-900 dark:text-white">{req.dealer_name || "Unknown Dealer"}</h3>
                             <p className="text-xs text-slate-500">{req.date}</p>
                          </div>
                       </div>
                       <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                         req.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
                         req.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 
                         'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                       }`}>
                         {req.status}
                       </span>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4 space-y-2">
                       {req.items && req.items.map((item: any, idx: number) => (
                         <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                            <span className="font-medium text-slate-900 dark:text-white">x {item.qty}</span>
                         </div>
                       ))}
                       <div className="border-t border-gray-200 dark:border-slate-700 pt-2 mt-2 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                          <span>Total Items</span>
                          <span>{req.total_items || req.totalItems}</span>
                       </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                         <button 
                           disabled={processingId === req.id}
                           onClick={() => handleStatusUpdate(req.id, 'accepted')}
                           className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50"
                         >
                           {processingId === req.id ? '...' : 'Accept'}
                         </button>
                         <button 
                           disabled={processingId === req.id}
                           onClick={() => handleStatusUpdate(req.id, 'rejected')}
                           className="flex-1 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border border-red-200 dark:border-red-900/30"
                         >
                           Reject
                         </button>
                         <button 
                           onClick={() => handleRateDealer(req)}
                           className="p-2 border border-gray-200 dark:border-slate-800 rounded-lg text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
                         >
                           <Star className="w-5 h-5" />
                         </button>
                      </div>
                    )}
                    
                    {req.status !== 'pending' && (
                      <div className="text-center text-sm text-slate-500 dark:text-slate-400 p-2 bg-gray-50 dark:bg-slate-800/30 rounded-lg">
                        {req.status === 'accepted' ? 'Request Accepted' : 'Request Rejected'}
                      </div>
                    )}
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {/* Rate Dealer Modal ... */}
      {showRateModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm"
          >
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Rate {selectedRequest.dealer_name}</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">How was your experience with this dealer request?</p>
             
             <div className="flex justify-center gap-2 mb-8">
               {[1, 2, 3, 4, 5].map(star => (
                 <button key={star} className="text-yellow-400 hover:scale-110 transition-transform">
                   <Star className="w-8 h-8 fill-current" />
                 </button>
               ))}
             </div>

             <div className="flex gap-3">
               <button 
                 onClick={() => setShowRateModal(false)}
                 className="flex-1 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => {
                   alert("Rating submitted!");
                   setShowRateModal(false);
                 }}
                 className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium"
               >
                 Submit Rating
               </button>
             </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
