'use client';

import { useState } from "react";
import { processInvoice } from "@/actions/invoice";
import { Upload, Loader2, CheckCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function InvoiceUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const res = await processInvoice(formData);
      setResult(res.data);
    } catch (error) {
      console.error(error);
      alert("Failed to process invoice");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 dark:border-slate-800 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors bg-gray-50 dark:bg-slate-900/20">
        <input
          type="file"
          id="invoice-upload"
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
        />
        <label 
          htmlFor="invoice-upload"
          className="cursor-pointer flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-blue-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Upload Invoice</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Take a photo or upload an image to auto-extract items
            </p>
          </div>
        </label>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4 text-green-500">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Extraction Successful</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Date</span>
              <span className="text-slate-900 dark:text-white">{result.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Total Amount</span>
              <span className="text-slate-900 dark:text-white font-bold">₹{result.total_amount}</span>
            </div>
            
            <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-4">
              <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Extracted Items</h4>
              <div className="space-y-2">
                {result.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{item.name} x{item.quantity}</span>
                    <span className="text-slate-900 dark:text-white">₹{item.total_price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
