import { useState, useEffect } from "react";
import { Search, Filter, Package, ChevronDown, ChevronUp, History, Tag, AlertCircle, Sparkles, Plus, Trash2, Edit2, X, Save, Upload, Loader2, Image as ImageIcon, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { addInventoryItem, updateInventoryItem, deleteInventoryItem, uploadProductImage } from "@/actions/inventory_manager";

interface InventoryViewProps {
  inventory: any[];
}

// Simple Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
        type === 'success' 
          ? 'bg-white dark:bg-slate-900 border-green-500/50 text-green-600 dark:text-green-400' 
          : 'bg-white dark:bg-slate-900 border-red-500/50 text-red-600 dark:text-red-400'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      <span className="font-medium text-slate-900 dark:text-white">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default function InventoryView({ inventory }: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  
  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", price: "", category: "", description: "", image: "" });
  const [editItem, setEditItem] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);

  const categories = ["All", ...Array.from(new Set(inventory.map(item => item.category)))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleExpand = (item: any) => {
    if (isEditMode) return; 
    setExpandedId(expandedId === item.docId ? null : item.docId);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    if (!e.target.files?.[0]) return;
    
    if (isEdit) setUploadingEditImage(true);
    else setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const imageUrl = await uploadProductImage(formData);
      if (isEdit) {
        // Update local state
        setEditItem((prev: any) => ({ ...prev, image: imageUrl }));
        
        // Immediate save to DB for the image
        if (editItem && editItem.docId) {
             await updateInventoryItem(editItem.docId, { ...editItem, image: imageUrl });
             showToast("Image updated successfully", "success");
        }
      } else {
        setNewItem(prev => ({ ...prev, image: imageUrl }));
      }
    } catch (error) {
      console.error("Image upload failed", error);
      showToast("Failed to upload image", "error");
    } finally {
      if (isEdit) setUploadingEditImage(false);
      else setUploadingImage(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.image) {
      showToast("Product image is compulsory!", "error");
      return;
    }
    try {
      await addInventoryItem(newItem);
      setIsAddModalOpen(false);
      setNewItem({ name: "", quantity: "", price: "", category: "", description: "", image: "" });
      showToast("Item added successfully", "success");
    } catch (error) {
      showToast("Failed to add item", "error");
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteInventoryItem(docId);
      showToast("Item deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete item", error);
      showToast("Failed to delete item", "error");
    }
  };

  const handleUpdate = async (docId: string, silent: boolean = false) => {
    try {
      await updateInventoryItem(docId, editItem);
      // Don't close edit mode on silent update (blur)
      if (!silent) {
        setIsEditMode(null);
        setEditItem(null);
      }
      if (!silent) showToast("Item updated successfully", "success");
    } catch (error) {
      console.error("Failed to update item", error);
      if (!silent) showToast("Failed to update item", "error");
    }
  };

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* Filters & Add Button */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors shadow-sm dark:shadow-none"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Product</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Product Image (Compulsory)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={uploadingImage}
                    />
                    <div className={`border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 text-center transition-colors ${newItem.image ? 'bg-gray-50 dark:bg-slate-800' : 'hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <span className="text-sm text-slate-500 dark:text-slate-400">Uploading...</span>
                        </div>
                      ) : newItem.image ? (
                        <div className="relative h-40 w-full">
                          <img src={newItem.image} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <span className="text-white text-sm font-medium">Click to change</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                          <span className="text-sm text-slate-500 dark:text-slate-400">Click to upload image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Item Name</label>
                  <input 
                    type="text" 
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                    placeholder="e.g., Maggi Noodles"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Quantity</label>
                    <input 
                      type="number" 
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Selling Price (₹)</label>
                    <input 
                      type="number" 
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Description</label>
                  <textarea 
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none min-h-[80px]"
                    placeholder="Describe the product..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Category (Optional)</label>
                  <input 
                    type="text" 
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                    placeholder="e.g., Snacks"
                  />
                </div>

                <button 
                  onClick={handleAddItem}
                  disabled={uploadingImage || !newItem.name || !newItem.quantity || !newItem.price}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 disabled:dark:bg-slate-800 disabled:text-gray-500 disabled:dark:text-slate-500 text-white font-medium py-3 rounded-xl mt-4 transition-colors"
                >
                  Add to Inventory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inventory Grid */}
      <div className="grid gap-4">
        {filteredInventory.map((item, index) => (
          <motion.div
            key={item.docId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-200 shadow-sm dark:shadow-none ${
              expandedId === item.docId ? 'ring-1 ring-blue-500/50 shadow-lg shadow-blue-900/10' : 'hover:border-gray-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Item Info */}
              <div 
                className="flex items-center gap-4 flex-1 cursor-pointer w-full"
                onClick={() => handleExpand(item)}
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-700 relative group">
                   {isEditMode === item.docId ? (
                     <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, true)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          disabled={uploadingEditImage}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                           {uploadingEditImage ? (
                             <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                           ) : (
                             <Upload className="w-6 h-6 text-white" />
                           )}
                        </div>
                        {editItem.image ? (
                          <img src={editItem.image} alt={editItem.name} className="w-full h-full object-cover opacity-50" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">
                            {item.emoji || '📦'}
                          </div>
                        )}
                     </>
                   ) : (
                     item.image ? (
                       <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-2xl">
                         {item.emoji || '📦'}
                       </div>
                     )
                   )}
                </div>
                <div className="flex-1">
                  {isEditMode === item.docId ? (
                    <input 
                      type="text" 
                      value={editItem.name}
                      onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                      onBlur={() => handleUpdate(item.docId, true)}
                      className="bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white w-full mb-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{item.name}</h3>
                  )}
                  
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50">
                      <Tag className="w-3 h-3" />
                      {item.category}
                    </span>
                    {item.quantity < 10 && (
                      <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions & Stats */}
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Price</p>
                  {isEditMode === item.docId ? (
                    <input 
                      type="number" 
                      value={editItem.price}
                      onChange={(e) => setEditItem({...editItem, price: Number(e.target.value)})}
                      onBlur={() => handleUpdate(item.docId, true)}
                      className="bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white w-20 text-right"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-xl font-bold text-slate-900 dark:text-white">₹{item.sellingPrice || item.average_price || 0}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Qty</p>
                  {isEditMode === item.docId ? (
                    <input 
                      type="number" 
                      value={editItem.quantity}
                      onChange={(e) => setEditItem({...editItem, quantity: Number(e.target.value)})}
                      onBlur={() => handleUpdate(item.docId, true)}
                      className="bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white w-20 text-right"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{item.quantity}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditMode === item.docId ? (
                    <>
                      <button 
                        onClick={() => handleUpdate(item.docId)}
                        className="p-2 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-500 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-600/30"
                        title="Finish Editing"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setIsEditMode(item.docId); setEditItem({...item, price: item.sellingPrice || item.average_price}); }}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.docId)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 bg-gray-100 dark:bg-slate-800 cursor-pointer ${
                      expandedId === item.docId ? 'rotate-180 text-blue-500 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                    onClick={() => handleExpand(item)}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedId === item.docId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/30"
                >
                  <div className="p-5">
                    {item.description && (
                      <div className="mb-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
                        <h5 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</h5>
                        <p className="text-slate-900 dark:text-white text-sm">{item.description}</p>
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
