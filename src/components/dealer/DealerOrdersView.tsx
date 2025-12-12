'use client';

import { useState } from 'react';
import { Package, Truck, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DealerOrdersView({ requests }: { requests: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-16 h-16 bg-purple-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Past Orders</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          You haven't raised any stock requests yet. Use the "Raise Invoice" tab to order stock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-purple-600 outline-none" /> Sent Orders
        </h2>
        <span className="text-sm text-slate-500 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">
          {requests.length} Total
        </span>
      </div>

      <div className="space-y-4">
        {requests.map((request, index) => (
          <motion.div 
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300
              ${expandedId === request.id 
                ? 'border-purple-500 ring-1 ring-purple-500 shadow-lg' 
                : 'border-gray-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-slate-700 shadow-sm'
              }
            `}
          >
            {/* Header / Summary */}
            <div 
              onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
              className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getStatusColorBg(request.status)}`}>
                    {getStatusIcon(request.status)}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Order to {request.vendor_name || 'Vendor'}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                       <span>{request.total_items} Items</span> • <span>{request.date}</span>
                    </p>
                 </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                 <StatusBadge status={request.status} />
                 <div className="text-slate-400">
                   {expandedId === request.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                 </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedId === request.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800"
                >
                   <div className="p-6">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Order Items</h4>
                      <div className="grid gap-3">
                         {request.items?.map((item: any, i: number) => (
                           <div key={i} className="flex justify-between items-center text-sm p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
                              <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">x{item.qty}</span>
                           </div>
                         ))}
                      </div>
                      
                      {request.status === 'accepted' && (
                        <div className="mt-6 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
                           <CheckCircle className="w-4 h-4" /> Stock added to your inventory.
                        </div>
                      )}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'accepted': return <CheckCircle className="w-6 h-6 text-green-600" />;
    case 'rejected': return <XCircle className="w-6 h-6 text-red-600" />;
    default: return <Clock className="w-6 h-6 text-orange-600" />;
  }
}

function getStatusColorBg(status: string) {
  switch (status) {
    case 'accepted': return 'bg-green-100 dark:bg-green-900/30';
    case 'rejected': return 'bg-red-100 dark:bg-red-900/30';
    default: return 'bg-orange-100 dark:bg-orange-900/30';
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    accepted: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-200 dark:border-green-500/30',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-200 dark:border-red-500/30',
    pending: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/30'
  };

  const labels = {
    accepted: 'Completed',
    rejected: 'Rejected',
    pending: 'Pending Approval'
  };

  const key = status as keyof typeof styles;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[key] || styles.pending}`}>
      {labels[key] || 'Pending'}
    </span>
  );
}
