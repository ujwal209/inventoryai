'use client';

import { useState } from 'react';
import { Search, Package, ArrowRight, CheckCircle, Truck, User, FileText, ChevronRight, ShoppingCart, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createStockRequest } from "@/actions/requests";

interface RaiseInvoiceViewProps {
  inventory: any[];
  vendors: any[];
}

export default function RaiseInvoiceView({ inventory, vendors = [] }: RaiseInvoiceViewProps) {
  const [step, setStep] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  
  const toggleItemSelection = (item: any) => {
    if (selectedItems.find(i => i.docId === item.docId)) {
      setSelectedItems(prev => prev.filter(i => i.docId !== item.docId));
    } else {
      setSelectedItems(prev => [...prev, { ...item, orderQty: 1 }]);
    }
  };

  const updateItemQty = (docId: string, qty: number) => {
    // Allow any quantity request, vendor can reject if not available? 
    // Or limit to some reasonable number. The user removed 'Credit Used' which implies flexibility.
    // I will allow any positive number.
    setSelectedItems(prev => prev.map(i => i.docId === docId ? { ...i, orderQty: Math.max(1, qty) } : i));
  };

  const handleSendRequest = async () => {
    if (!selectedVendor || selectedItems.length === 0) return;
    
    setLoading(true);
    try {
      await createStockRequest(selectedVendor.id, selectedItems);
      toast.success(`Invoice raised to ${selectedVendor.name} successfully!`);
      // Reset
      setStep(1);
      setSelectedVendor(null);
      setSelectedItems([]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to raise invoice.");
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalApproxValue = selectedItems.reduce((acc, item) => acc + (item.orderQty * (item.average_price || 0)), 0);

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-purple-600" /> Raise Purchase Invoice
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Request stock replenishment from your trusted vendors.</p>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full px-4 py-2 shadow-sm">
           <StepDot step={1} current={step} label="Vendor" />
           <StepLine active={step >= 2} />
           <StepDot step={2} current={step} label="Items" />
           <StepLine active={step >= 3} />
           <StepDot step={3} current={step} label="Confirm" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
             <div className="grid md:grid-cols-3 gap-6">
               {vendors.map((vendor, index) => (
                 <div 
                   key={vendor.id}
                   onClick={() => setSelectedVendor(vendor)}
                   className={`
                     relative cursor-pointer group rounded-3xl p-6 border-2 transition-all duration-300 overflow-hidden
                     ${selectedVendor?.id === vendor.id 
                       ? 'border-purple-500 bg-white dark:bg-slate-900 shadow-xl shadow-purple-500/10' 
                       : 'border-transparent bg-white dark:bg-slate-900 hover:border-purple-200 dark:hover:border-slate-800 shadow-sm hover:shadow-md'
                     }
                   `}
                 >
                    {/* Background decoration */}
                    <div className={`absolute top-0 right-0 p-16 bg-gradient-to-br from-purple-500/5 to-transparent rounded-bl-full transition-transform group-hover:scale-110`} />

                    <div className="relative z-10 flex flex-col items-center">
                       <div className={`w-20 h-20 rounded-2xl mb-4 p-0.5 bg-gradient-to-br ${selectedVendor?.id === vendor.id ? 'from-purple-500 to-pink-500' : 'from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800'}`}>
                         <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                            {vendor.image ? (
                              <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl font-bold text-slate-400">{vendor.name.charAt(0)}</span>
                            )}
                         </div>
                       </div>
                       
                       <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{vendor.name}</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                         <span className="w-2 h-2 rounded-full bg-green-500"></span> Active Vendor
                       </p>

                       {selectedVendor?.id === vendor.id && (
                         <motion.div layoutId="selected-check" className="absolute top-0 right-0 m-4 text-purple-600">
                           <CheckCircle className="w-6 h-6 fill-purple-100" />
                         </motion.div>
                       )}
                    </div>
                 </div>
               ))}
               {vendors.length === 0 && (
                 <div className="col-span-3 text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800">
                    <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No vendors connected.</p>
                 </div>
               )}
             </div>
             
             <div className="flex justify-end pt-4">
               <button 
                 onClick={() => setStep(2)} 
                 disabled={!selectedVendor}
                 className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
               >
                 Select Items <ChevronRight className="w-4 h-4" />
               </button>
             </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
             <div className="flex flex-col md:flex-row gap-6 h-[600px]">
                {/* Left: Inventory List */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                   <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex gap-4 bg-gray-50/50 dark:bg-slate-900/50">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                          placeholder="Search your inventory to restock..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                     {filteredInventory.map(item => {
                       const isSelected = selectedItems.find(i => i.docId === item.docId);
                       return (
                         <div 
                           key={item.docId}
                           onClick={() => toggleItemSelection(item)}
                           className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                             isSelected 
                               ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800' 
                               : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-800'
                           }`}
                         >
                            <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-slate-800 overflow-hidden`}>
                               {item.image ? (
                                 <img src={item.image} className="w-full h-full object-cover" />
                               ) : (
                                 <span className="text-xl">{item.emoji || '📦'}</span>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.name}</h4>
                               <p className="text-xs text-slate-500 truncate">{item.brand || 'Generic'} • {item.quantity} in stock</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                               {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                         </div>
                       );
                     })}
                   </div>
                </div>

                {/* Right: Selected Cart */}
                <div className="w-full md:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col p-6">
                   <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                     <ShoppingCart className="w-5 h-5 text-purple-500" /> Cart ({selectedItems.length})
                   </h3>
                   
                   <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {selectedItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                           <Package className="w-12 h-12 mb-2 opacity-50" />
                           <p className="text-sm">Select items from the left to add to invoice.</p>
                        </div>
                      ) : (
                        selectedItems.map(item => (
                          <div key={item.docId} className="flex gap-3 bg-gray-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                             <div className="flex-1">
                               <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                               <p className="text-xs text-slate-500">Est. Price: ₹{item.average_price}</p>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                               <label className="text-[10px] text-slate-400 font-bold uppercase">QTY</label>
                               <input 
                                 type="number" 
                                 className="w-16 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-sm text-right font-bold"
                                 value={item.orderQty}
                                 onChange={(e) => updateItemQty(item.docId, parseInt(e.target.value) || 0)}
                               />
                             </div>
                          </div>
                        ))
                      )}
                   </div>

                   <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-500">Approx. Total</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">₹{totalApproxValue.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setStep(1)} className="py-3 text-slate-500 hover:text-slate-900 font-medium bg-gray-100 dark:bg-slate-800 rounded-xl transition-colors">Back</button>
                         <button 
                           onClick={() => setStep(3)} 
                           disabled={selectedItems.length === 0}
                           className="py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:shadow-none"
                         >
                           Review
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto"
          >
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                {/* Receipt Header */}
                <div className="bg-purple-600 p-8 text-white text-center relative overflow-hidden">
                   <div className="relative z-10">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                         <FileText className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold">Review Invoice</h2>
                      <p className="text-purple-100 mt-1">Requesting stock from {selectedVendor.name}</p>
                   </div>
                   <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
                   <div className="absolute -top-6 -left-6 w-32 h-32 bg-white/10 rounded-full" />
                </div>

                <div className="p-8">
                   <div className="flex justify-between items-center text-sm mb-6 pb-6 border-b border-dashed border-gray-200 dark:border-slate-800">
                      <div>
                        <p className="text-slate-500 mb-1">Date</p>
                        <p className="font-bold flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 mb-1">Invoice ID</p>
                        <p className="font-bold font-mono">#INV-{Math.floor(Math.random()*10000)}</p>
                      </div>
                   </div>

                   <div className="space-y-4 mb-8">
                      {selectedItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center group">
                           <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 text-xs font-bold text-slate-500">
                                {i + 1}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                 <p className="text-xs text-slate-500">{item.brand}</p>
                              </div>
                           </div>
                           <p className="font-mono font-bold">x{item.orderQty}</p>
                        </div>
                      ))}
                   </div>

                   <div className="bg-gray-50 dark:bg-slate-950 rounded-xl p-4 mb-8">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-slate-500">Total Quantity</span>
                         <span className="font-bold">{selectedItems.reduce((a, b) => a + b.orderQty, 0)} Units</span>
                      </div>
                      <div className="flex justify-between items-center text-lg">
                         <span className="font-bold text-slate-900 dark:text-white">Est. Value</span>
                         <span className="font-bold text-purple-600">₹{totalApproxValue.toLocaleString()}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setStep(2)}
                        className="py-3.5 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={handleSendRequest}
                        disabled={loading}
                        className="py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                      >
                        {loading ? 'Sending...' : 'Confirm & Send'}
                      </button>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

const StepDot = ({ step, current, label }: { step: number, current: number, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${current >= step ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-slate-500'}`}>
      {current > step ? <CheckCircle className="w-4 h-4" /> : step}
    </div>
    <span className={`text-sm font-medium ${current >= step ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{label}</span>
  </div>
);

const StepLine = ({ active }: { active: boolean }) => (
  <div className={`w-8 h-0.5 mx-2 rounded-full transition-colors ${active ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-800'}`} />
);
