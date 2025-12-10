'use client';

import { useState } from "react";
import { format } from "date-fns";
import { FileText, Calendar, DollarSign, ChevronDown, ChevronUp, ExternalLink, Image as ImageIcon, Receipt, ShoppingBag, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceListProps {
  invoices: any[];
}

export default function InvoiceList({ invoices }: InvoiceListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-black/20">
          <Receipt className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No invoices found</h3>
        <p className="text-slate-400 max-w-xs text-center">
          Upload your first bill to start tracking your inventory and expenses automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {invoices.map((invoice, index) => (
        <motion.div 
          key={invoice.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`group relative bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 ${expandedId === invoice.id ? 'shadow-2xl shadow-blue-900/10 ring-1 ring-blue-500/20' : 'hover:shadow-lg hover:shadow-black/20'}`}
        >
          <div 
            className="p-5 flex items-center justify-between cursor-pointer"
            onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
          >
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${
                invoice.status === 'processed' 
                  ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/5 text-blue-400' 
                  : 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 text-yellow-400'
              }`}>
                <ShoppingBag className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">
                  {invoice.extracted_data?.vendor_name || "Unknown Vendor"}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                  <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                    <Calendar className="w-3.5 h-3.5" />
                    {invoice.extracted_data?.date || format(invoice.created_at, 'MMM dd, yyyy')}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Tag className="w-3.5 h-3.5" />
                    {invoice.extracted_data?.items?.length || 0} Items
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-slate-400 mb-0.5">Total Amount</p>
                <p className="text-xl font-bold text-white tracking-tight">
                  ₹{invoice.extracted_data?.total_amount?.toLocaleString() || 0}
                </p>
              </div>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 bg-slate-800/50 border border-slate-700/50 ${expandedId === invoice.id ? 'rotate-180 bg-blue-500/20 border-blue-500/30 text-blue-400' : 'text-slate-400'}`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {expandedId === invoice.id && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-t border-slate-800/60 bg-slate-950/30"
              >
                <div className="p-6 grid lg:grid-cols-2 gap-8">
                  {/* Image Preview */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Original Receipt
                    </h4>
                    <div className="relative aspect-[3/4] w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group/image shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={invoice.image_url} 
                        alt="Invoice" 
                        className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover/image:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                        <a 
                          href={invoice.image_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" /> View Full Size
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Receipt className="w-4 h-4" /> Extracted Line Items
                    </h4>
                    <div className="bg-slate-900/50 rounded-xl border border-slate-800/60 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[300px]">
                          <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800/60">
                            <tr>
                              <th className="px-4 py-3 font-medium">Item Description</th>
                              <th className="px-4 py-3 font-medium text-right w-20">Qty</th>
                              <th className="px-4 py-3 font-medium text-right w-24">Price</th>
                              <th className="px-4 py-3 font-medium text-right w-24">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {invoice.extracted_data?.items?.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-800/30 transition-colors group/row">
                                <td className="px-4 py-3 text-slate-200 font-medium group-hover/row:text-white transition-colors">
                                  {item.name}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-right font-mono">{item.quantity}</td>
                                <td className="px-4 py-3 text-slate-400 text-right font-mono">₹{item.unit_price}</td>
                                <td className="px-4 py-3 text-white text-right font-mono font-medium">₹{item.total_price}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-950/30 border-t border-slate-800/60">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 text-right text-slate-400 font-medium">Total</td>
                              <td className="px-4 py-3 text-right text-blue-400 font-bold font-mono text-base">
                                ₹{invoice.extracted_data?.total_amount?.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
